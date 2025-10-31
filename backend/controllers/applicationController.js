import StudentApplication from '../models/StudentApplication.js'
import User from '../models/User.js'
import Interview from '../models/Interview.js' // add this

// Map to canonical department code (fixed set)
function normalizeDepartment(input) {
  const s = String(input || '').trim().toUpperCase()

  // exact allowed values
  const ALLOWED = ['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML']
  if (ALLOWED.includes(s)) return s

  // common aliases -> map to fixed codes
  if (['CS', 'COMP', 'COMPUTER', 'CSIT'].includes(s)) return 'CSE'
  if (['MECH', 'MECHANICAL'].includes(s)) return 'ME'
  if (['ELECTRICAL', 'E&EE'].includes(s)) return 'EE'
  if (['ELECTRONICS', 'ECE', 'E&CE'].includes(s)) return 'EC'
  if (['CIV', 'CIV ENGINEERING'].includes(s)) return 'CIVIL'
  if (['AI', 'ML', 'AI&ML', 'AI-ML'].includes(s)) return 'AIML'

  return '' // unknown -> invalid
}

async function findHodForDepartment(department) {
  return User.findOne({ role: 'hod', department }, { _id: 1 }).lean()
}

// POST /applications
export async function createApplication(req, res) {
  const studentId = req.user.sub
  const { name, fatherName, email, cgpa, fatherIncome, department } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' })
  if (!fatherName) return res.status(400).json({ error: 'fatherName is required' })

  const existing = await StudentApplication.findOne({ student: studentId })
  if (existing) {
    // Block new applications when one already exists
    if (existing.status === 'rejected') {
      return res.status(403).json({ error: 'application was rejected. You cannot submit a new application.' })
    }
    return res.status(409).json({ error: 'application already exists' })
  }

  // Use student's typed department (normalized). Return 400 if unknown.
  const deptResolved = normalizeDepartment(department)
  if (!deptResolved) {
    return res.status(400).json({
      error: 'invalid department',
      allowed: ['IT','CE','CSE','ME','CIVIL','EE','EC','AIML']
    })
  }
  const hod = await findHodForDepartment(deptResolved)
  if (!hod) return res.status(404).json({ error: `No HOD found for department ${deptResolved}` })

  const app = await StudentApplication.create({
    student: studentId,
    name: name.trim(),
    fatherName: fatherName.trim(),
    email: String(email || '').toLowerCase().trim(),
    cgpa,
    fatherIncome,
    department: deptResolved,
    assignedHod: hod._id,
    status: 'submitted',
    messages: [{ text: 'Application submitted', by: 'system' }]
  })

  return res.status(201).json({
    id: app._id,
    status: app.status,
    department: app.department,
    assignedHod: app.assignedHod
  })
}

// GET /applications/me
export async function getMyApplication(req, res) {
  try {
    const uid = req.user.sub
    const app = await StudentApplication.findOne({ student: uid }).lean()
    if (!app) return res.json({ exists: false })

    const messages = app.messages || []
    const lastHod = messages.filter(m => m.by === 'hod').slice(-1)[0] || null
    const hodAction = lastHod ? { text: lastHod.text, note: lastHod.note, at: lastHod.at } : null
    const hodMarkedPending = app.status === 'submitted' && !!lastHod

    // Find upcoming pending interview (soonest)
    const next = await Interview.findOne({
      student: uid,
      result: 'pending',
      scheduledAt: { $gte: new Date() }
    }).sort({ scheduledAt: 1 }).lean()

    // Short message for dashboard
    const lastMessage = messages.length ? (messages[messages.length - 1].text || '') : ''
    const message = next
      ? `Interview scheduled on ${new Date(next.scheduledAt).toLocaleString()} (${next.mode})`
      : lastMessage

    res.json({
      exists: true,
      id: app._id,
      name: app.name,
      email: app.email,
      fatherName: app.fatherName,
      cgpa: app.cgpa,
      fatherIncome: app.fatherIncome,
      department: app.department,
      status: app.status,
      lastUpdate: app.updatedAt,
      documents: app.documents || {},
      hodAction,
      hodMarkedPending,
      // NEW: upcoming interview details for UI
      nextInterview: next ? {
        scheduledAt: next.scheduledAt,
        mode: next.mode,
        meetingUrl: next.meetingUrl || '',
        location: next.location || ''
      } : null,
      // NEW: brief message for dashboard
      message
    })
  } catch (e) {
    console.error('getMyApplication', e)
    res.status(500).json({ error: 'server error' })
  }
}

// PATCH /applications/:id/documents/:type
export async function uploadApplicationDocument(req, res) {
  const { id, type } = req.params
  const allowed = ['aadharCard', 'incomeCertificate', 'resume', 'resultsheet']
  if (!allowed.includes(type)) return res.status(400).json({ error: 'invalid document type' })

  const fileId = req.file?.id
  const url = req.file?.url || (fileId ? `/files/${fileId}` : null)
  if (!url) return res.status(400).json({ error: 'upload failed' })

  // Enforce status rules
  const app = await StudentApplication.findOne({ _id: id, student: req.user.sub })
  if (!app) return res.status(404).json({ error: 'application not found' })
  if (app.status === 'rejected') {
    return res.status(403).json({ error: 'cannot upload documents to a rejected application' })
  }
  if (app.status !== 'submitted') {
    return res.status(403).json({ error: 'uploads allowed only when application is pending' })
  }

  app.documents = app.documents || {}
  app.documents[type] = {
    url,
    filename: req.file?.filename,
    mimetype: req.file?.mimetype,
    size: req.file?.size
  }
  await app.save()

  return res.json({ success: true, documents: app.documents })
}

// Allow student to update their application while HOD-marked pending
export async function updateMyApplication(req, res) {
  try {
    const uid = req.user.sub
    const app = await StudentApplication.findOne({ student: uid })
    if (!app) return res.status(404).json({ error: 'application not found' })

    // Only allow updates when status is submitted and HOD has touched it
    const messages = app.messages || []
    const lastHod = messages.filter(m => m.by === 'hod').slice(-1)[0] || null
    const hodMarkedPending = app.status === 'submitted' && !!lastHod
    if (!hodMarkedPending) {
      return res.status(400).json({ error: 'updates allowed only when HOD marked pending' })
    }

    const { name, email, fatherName, cgpa, fatherIncome, department } = req.body || {}
    if (name !== undefined) app.name = String(name).trim()
    if (email !== undefined) app.email = String(email).trim()
    if (fatherName !== undefined) app.fatherName = String(fatherName).trim()
    if (cgpa !== undefined && cgpa !== null && cgpa !== '') app.cgpa = Number(cgpa)
    if (fatherIncome !== undefined && fatherIncome !== null && fatherIncome !== '') app.fatherIncome = Number(fatherIncome)
    if (department !== undefined) app.department = String(department).trim()

    await app.save()
    res.json({ ok: true })
  } catch (e) {
    console.error('updateMyApplication', e)
    res.status(500).json({ error: 'server error' })
  }
}