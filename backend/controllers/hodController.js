import User from '../models/User.js'
import Project from '../models/Project.js'
import StudentApplication from '../models/StudentApplication.js'
import Interview from '../models/Interview.js'

// GET: students eligible and not assigned yet
export async function listEligibleStudents(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const rows = await StudentApplication.find({
    department: me.department,
    assignedFaculty: null, // exclude already assigned
    $or: [{ status: 'accepted' }, { finalResult: 'pass' }]
  })
    .select('student name email status finalResult createdAt')
    .populate('student', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  res.json(rows)
}

// List faculties in HOD's department
export async function listDepartmentFaculties(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
  const rows = await User.find({ role: 'faculty', department: me.department })
    .select('_id name email')
    .sort({ name: 1 })
    .lean()
  res.json(rows)
}

// GET: projects assigned to this HOD (or department)
export async function listDepartmentProjects(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
  const rows = await Project.find({
    department: me.department,
    $or: [{ assignedHod: me._id }, { assignedHod: null }]
  })
    .select('_id title description docLink')
    .sort({ createdAt: -1 })
    .lean()
  res.json(rows)
}

// Assign faculty + project (+ optional start/end)
export async function assignFacultyProject(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { id } = req.params
  const { facultyId, projectId, projectTitle, projectDescription, startAt, endAt } = req.body || {}

  const app = await StudentApplication.findById(id)
  if (!app) return res.status(404).json({ error: 'application not found' })
  if (String(app.department) !== String(me.department)) return res.status(403).json({ error: 'not your department' })
  if (app.assignedFaculty) return res.status(400).json({ error: 'already assigned' })
  if (!(app.status === 'accepted' || app.finalResult === 'pass')) return res.status(400).json({ error: 'student not eligible' })

  const fac = await User.findOne({ _id: facultyId, role: 'faculty', department: me.department }).lean()
  if (!fac) return res.status(400).json({ error: 'invalid faculty' })

  let proj = null
  if (projectId) {
    proj = await Project.findOne({ _id: projectId, department: me.department }).lean()
    if (!proj) return res.status(400).json({ error: 'invalid project' })
  }

  // Optional time window validation
  if (startAt || endAt) {
    if (!startAt || !endAt) return res.status(400).json({ error: 'startAt and endAt are required together' })
    const start = new Date(startAt), end = new Date(endAt)
    if (isNaN(start) || isNaN(end) || end <= start) return res.status(400).json({ error: 'invalid start/end' })
    app.startAt = start
    app.endAt = end
  }

  app.assignedFaculty = fac._id
  app.assignedProject = proj ? proj._id : null
  app.assignedProjectTitle = projectTitle || proj?.title || ''
  app.assignedProjectDescription = projectDescription || proj?.description || ''
  app.assignedAt = new Date()

  await app.save()
  res.json({ ok: true })
}

// List applications for HOD’s department (optional ?status=submitted|accepted|rejected|all)
export async function listHodApplications(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { status } = req.query
  const q = { department: me.department }
  if (status && status !== 'all') {
    if (['submitted', 'accepted', 'rejected'].includes(status)) q.status = status
  }

  const rows = await StudentApplication.find(q)
    .select('_id student name email status finalResult assignedFaculty createdAt')
    .populate('student', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  res.json(rows)
}

// Aliases to match route imports
export async function listDepartmentApplications(req, res) {
  return listHodApplications(req, res)
}
export async function listProjects(req, res) {
  return listDepartmentProjects(req, res)
}
export async function listFaculties(req, res) {
  return listDepartmentFaculties(req, res)
}

// GET one application for HOD
export async function getApplicationForHod(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
  const app = await StudentApplication.findOne({ _id: req.params.id, department: me.department })
    .populate('student', 'name email')
    .lean()
  if (!app) return res.status(404).json({ error: 'application not found' })
  res.json(app)
}

// PATCH application status
export async function setApplicationStatus(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
  const { id } = req.params
  const { status, note } = req.body || {}
  const allowed = ['submitted','accepted','rejected']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid status' })

  const app = await StudentApplication.findOne({ _id: id, department: me.department })
  if (!app) return res.status(404).json({ error: 'application not found' })

  app.status = status
  app.messages = app.messages || []
  app.messages.push({ by: 'hod', text: `Status: ${status}${note ? ` - ${note}` : ''}`, note, at: new Date() })
  await app.save()
  res.json({ ok: true, status })
}

// List interviews for this HOD (status: pending | completed | all)
export async function listInterviews(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { status = 'pending', limit: limitRaw } = req.query
  const q = { hod: me._id }
  if (status === 'pending') q.result = 'pending'
  if (status === 'completed') q.result = { $in: ['pass', 'fail'] }

  const sort = status === 'completed' ? { scoredAt: -1, scheduledAt: -1 } : { scheduledAt: 1 }
  const limit = Math.min(parseInt(limitRaw ?? (status === 'completed' ? '10' : '0'), 10) || 0, 50)

  let cur = Interview.find(q)
    .populate('student', 'name email')
    .populate('application', '_id')
    .sort(sort)
    .lean()

  if (limit > 0) cur = cur.limit(limit)

  const rows = await cur
  res.json(rows)
}

// Schedule interview for an application
export async function scheduleInterview(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { applicationId, scheduledAt, mode = 'online', meetingUrl, location, notes } = req.body || {}
  if (!applicationId || !scheduledAt) return res.status(400).json({ error: 'applicationId and scheduledAt are required' })

  const when = new Date(scheduledAt)
  if (isNaN(when) || when.getTime() <= Date.now()) return res.status(400).json({ error: 'scheduledAt must be a future time' })
  if (!['online','offline'].includes(mode)) return res.status(400).json({ error: 'invalid mode' })
  if (mode === 'online' && !/^https?:\/\//i.test(meetingUrl || '')) return res.status(400).json({ error: 'valid meetingUrl required for online' })
  if (mode === 'offline' && !String(location || '').trim()) return res.status(400).json({ error: 'location required for offline' })

  const app = await StudentApplication.findById(applicationId).lean()
  if (!app) return res.status(404).json({ error: 'application not found' })
  if (String(app.department) !== String(me.department)) return res.status(403).json({ error: 'not your department' })
  if (app.status !== 'accepted') return res.status(400).json({ error: 'application must be accepted to schedule interview' })

  const iv = await Interview.create({
    application: app._id,
    student: app.student,
    hod: me._id,
    scheduledAt: when,
    mode,
    meetingUrl: mode === 'online' ? meetingUrl : undefined,
    location: mode === 'offline' ? location : undefined,
    notes
  })

  res.status(201).json({ id: iv._id })
}

// Set interview result (pass/fail) and update application.finalResult
export async function setInterviewResult(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { id } = req.params
  const { result, notes } = req.body || {}
  if (!['pass','fail'].includes(result)) return res.status(400).json({ error: 'invalid result' })

  const iv = await Interview.findOne({ _id: id, hod: me._id })
  if (!iv) return res.status(404).json({ error: 'interview not found' })
  if (iv.result !== 'pending') return res.status(400).json({ error: 'result already set' })

  iv.result = result
  iv.notes = notes || iv.notes
  iv.scoredBy = me._id
  iv.scoredAt = new Date()
  await iv.save()

  // Update the related application finalResult for downstream eligibility
  let app = null
  if (iv.application) {
    app = await StudentApplication.findById(iv.application)
  } else {
    app = await StudentApplication.findOne({ student: iv.student, department: me.department })
  }
  if (app) {
    app.finalResult = result
    await app.save()
  }

  res.json({ ok: true })
}