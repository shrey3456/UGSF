import StudentApplication from '../models/StudentApplication.js'
import User from '../models/User.js'

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
  const app = await StudentApplication.findOne({ student: req.user.sub })
    .populate('assignedHod', 'name email department')
    .lean()

  if (!app) return res.json({ exists:false, status:'none', message:'No application found.', lastUpdate:null })

  const msgs = app.messages || []
  const hodMsgs = msgs.filter(m => m.by === 'hod')
  const lastHod = hodMsgs[hodMsgs.length - 1] || null

  res.json({
    id: app._id,
    exists: true,
    status: app.status,
    message: msgs[msgs.length - 1]?.text || `Current status: ${app.status}`,
    lastUpdate: app.updatedAt,
    documents: app.documents || {},
    assignedHod: app.assignedHod || null,
    hodAction: lastHod ? {
      status: lastHod.status || null,
      note: lastHod.note || null,
      text: lastHod.text || null,
      at: lastHod.at || app.updatedAt
    } : null
  })
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