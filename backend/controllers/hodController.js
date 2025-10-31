import StudentApplication from '../models/StudentApplication.js'
import Interview from '../models/Interview.js'
import User from '../models/User.js'

// GET /hod/applications?status=pending|accepted|rejected
export async function listDepartmentApplications(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

    const f = String(req.query.status || '').toLowerCase()
    const q = { department: me.department }
    if (['pending', 'accepted', 'rejected'].includes(f)) q.status = f === 'pending' ? 'submitted' : f

    const rows = await StudentApplication.find(q)
      .select('student name email status department createdAt') // need student for per-row interview logic
      .sort({ createdAt: -1 })
      .lean()

    res.json(rows)
  } catch (e) {
    console.error('listDepartmentApplications', e)
    res.status(500).json({ error: 'server error' })
  }
}

// PATCH /hod/applications/:id/status   body: { status, note? }
export async function setApplicationStatus(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { status, note } = req.body
  if (!['submitted', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' })
  }

  const app = await StudentApplication.findOne({ _id: req.params.id, department: me.department })
  if (!app) return res.status(404).json({ error: 'application not found' })

  app.status = status
  app.messages = app.messages || []
  app.messages.push({
    by: 'hod',
    status,
    note: note || null,
    text:
      status === 'accepted' ? 'HOD approved the application' :
      status === 'rejected' ? 'HOD rejected the application' :
      'HOD marked the application as pending',
    at: new Date()
  })
  await app.save()
  res.json({ id: app._id, status: app.status })
}

// GET /hod/interviews?upcoming=true&student=:id
export async function listInterviews(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const q = { hod: me._id }
  if (String(req.query.upcoming || '').toLowerCase() === 'true') {
    q.scheduledAt = { $gte: new Date() }
  }
  if (req.query.student) q.student = req.query.student

  const rows = await Interview.find(q)
    .populate('student', 'name email')
    .sort({ scheduledAt: 1 })
    .lean()

  res.json(rows)
}

// POST /hod/interviews
// body: { applicationId, scheduledAt, mode, meetingUrl?, location?, notes? }
export async function scheduleInterview(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { applicationId, scheduledAt, mode, meetingUrl, location, notes } = req.body
  if (!applicationId || !scheduledAt || !mode) {
    return res.status(400).json({ error: 'applicationId, scheduledAt and mode are required' })
  }
  const when = new Date(scheduledAt)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'scheduled time must be in the future' })
  }
  if (!['online', 'offline'].includes(mode)) return res.status(400).json({ error: 'invalid mode' })
  if (mode === 'online' && !(meetingUrl && /^https?:\/\//i.test(meetingUrl))) {
    return res.status(400).json({ error: 'valid meetingUrl is required for online interviews' })
  }
  if (mode === 'offline' && !String(location || '').trim()) {
    return res.status(400).json({ error: 'location is required for offline interviews' })
  }

  const app = await StudentApplication.findById(applicationId)
  if (!app || app.department !== me.department) return res.status(404).json({ error: 'application not found' })
  if (app.status !== 'accepted') return res.status(400).json({ error: 'interview can be scheduled only after acceptance' })

  const interview = await Interview.create({
    student: app.student,
    hod: me._id,
    scheduledAt: when,
    mode,
    meetingUrl: mode === 'online' ? meetingUrl : undefined,
    location: mode === 'offline' ? location : undefined,
    notes
  })

  app.messages.push({
    by: 'hod',
    text: `Interview scheduled (${mode}) on ${when.toLocaleString()}`,
    at: new Date()
  })
  await app.save()

  res.status(201).json(interview)
}

// PATCH /hod/interviews/:id/result   body: { result: 'pass'|'fail'|'pending', note? }
export async function setInterviewResult(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { id } = req.params
  const { result, note } = req.body
  if (!['pass', 'fail', 'pending'].includes(result)) {
    return res.status(400).json({ error: 'invalid result' })
  }

  const interview = await Interview.findOne({ _id: id, hod: me._id })
  if (!interview) return res.status(404).json({ error: 'interview not found' })

  interview.result = result
  if (note) interview.notes = note
  interview.scoredBy = me._id
  interview.scoredAt = new Date()
  await interview.save()

  const app = await StudentApplication.findOne({ student: interview.student, department: me.department })
  if (app) {
    app.messages.push({
      by: 'hod',
      text: `Interview result: ${result.toUpperCase()}` + (note ? ` • Remark: ${note}` : ''),
      at: new Date(),
      status: result === 'fail' ? 'rejected' : 'accepted',
      note: note || null
    })
    // Optional finalResult field for quick lookup (if schema allows; else still fine in messages)
    app.set('finalResult', result, { strict: false })
    if (result === 'fail') app.status = 'rejected'
    await app.save()
  }

  res.json({ id: interview._id, result: interview.result })
}

// GET /hod/faculties
export async function listDepartmentFaculties(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
    const rows = await User.find({ role: 'faculty', department: me.department })
      .select('_id name email')
      .sort({ name: 1 })
      .lean()
    res.json(rows)
  } catch (e) {
    console.error('listDepartmentFaculties', e)
    res.status(500).json({ error: 'server error' })
  }
}

// PATCH /hod/applications/:id/assign
// body: { facultyId, projectTitle, projectDescription?, startAt?, endAt? }
export async function assignFacultyProject(req, res) {
  try {
    const me = await User.findById(req.user.sub).lean()
    if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

    const { id } = req.params
    const { facultyId, projectTitle, projectDescription, startAt, endAt } = req.body || {}

    if (!facultyId || !projectTitle) {
      return res.status(400).json({ error: 'facultyId and projectTitle are required' })
    }

    const app = await StudentApplication.findOne({ _id: id, department: me.department })
    if (!app) return res.status(404).json({ error: 'application not found' })
    if (app.assignedFaculty) return res.status(400).json({ error: 'already assigned' })
    if (!(app.status === 'accepted' || app.finalResult === 'pass')) {
      return res.status(400).json({ error: 'student not eligible' })
    }

    const fac = await User.findOne({ _id: facultyId, role: 'faculty', department: me.department }).lean()
    if (!fac) return res.status(400).json({ error: 'invalid faculty' })

    // optional time window
    if ((startAt && !endAt) || (!startAt && endAt)) {
      return res.status(400).json({ error: 'startAt and endAt are required together' })
    }
    if (startAt && endAt) {
      const s = new Date(startAt), e = new Date(endAt)
      if (isNaN(s) || isNaN(e) || e <= s) return res.status(400).json({ error: 'invalid start/end' })
      app.startAt = s
      app.endAt = e
    }

    app.assignedFaculty = fac._id
    app.assignedProjectTitle = String(projectTitle).trim()
    app.assignedProjectDescription = String(projectDescription || '').trim()
    app.assignedAt = new Date()

    await app.save()
    res.json({ ok: true })
  } catch (e) {
    console.error('assignFacultyProject', e)
    res.status(500).json({ error: 'server error' })
  }
}

// ENHANCE: GET /hod/applications/:id -> return assignedFaculty populated + project shape
export async function getApplicationForHod(req, res) {
  const me = await User.findById(req.user.sub).lean()
  if (!me || me.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const app = await StudentApplication.findOne({ _id: req.params.id, department: me.department })
    .populate('assignedFaculty', 'name email')
    .lean()
  if (!app) return res.status(404).json({ error: 'not found' })

  // Present project in the shape ApplicationView expects
  const project = {
    title: app.assignedProjectTitle || '',
    description: app.assignedProjectDescription || '',
    startDate: app.startAt || null,
    endDate: app.endAt || null
  }
  app.project = project

  res.json(app)
}