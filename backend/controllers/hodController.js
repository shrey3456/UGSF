import StudentApplication from '../models/StudentApplication.js'
import User from '../models/User.js'

// GET /hod/applications?status=pending|accepted|rejected
export async function listDepartmentApplications(req, res) {
  const hod = await User.findById(req.user.sub).lean()
  if (!hod || hod.role !== 'hod') return res.status(403).json({ error: 'forbidden' })
  const statusMap = { pending: 'submitted', accepted: 'accepted', rejected: 'rejected' }
  const status = statusMap[req.query.status] || undefined

  const query = { department: hod.department }
  if (status) query.status = status

  const apps = await StudentApplication.find(query)
    .select('name email department status createdAt')
    .sort({ createdAt: -1 })
    .lean()

  res.json(apps)
}

// GET /hod/applications/:id
export async function getApplicationForHod(req, res) {
  const hod = await User.findById(req.user.sub).lean()
  if (!hod || hod.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const app = await StudentApplication.findById(req.params.id).lean()
  if (!app || app.department !== hod.department) {
    return res.status(404).json({ error: 'application not found' })
  }
  res.json(app)
}

// PATCH /hod/applications/:id/status { status: 'accepted'|'rejected', note?: string }
export async function setApplicationStatus(req, res) {
  const hod = await User.findById(req.user.sub).lean()
  if (!hod || hod.role !== 'hod') return res.status(403).json({ error: 'forbidden' })

  const { status, note } = req.body
  if (!['accepted', 'rejected', 'submitted'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' })
  }

  const app = await StudentApplication.findOne({ _id: req.params.id, department: hod.department })
  if (!app) return res.status(404).json({ error: 'application not found' })

  app.status = status
  const message =
    status === 'accepted' ? 'HOD approved the application'
    : status === 'rejected' ? `HOD rejected the application${note ? `: ${note}` : ''}`
    : 'Status set to pending by HOD'
  app.messages.push({ text: message, by: 'hod' })
  await app.save()

  res.json({ id: app._id, status: app.status, updatedAt: app.updatedAt })
}