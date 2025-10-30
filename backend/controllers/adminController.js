import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import StudentApplication from '../models/StudentApplication.js'
import * as xlsx from 'xlsx'  // ESM-friendly import
import Project from '../models/Project.js'

export async function createUserByAdmin(req, res) {
  const { name, email, password, role, department } = req.body
  if (!name || !email || !role) return res.status(400).json({ error: 'missing fields' })
  if (!['hod', 'faculty'].includes(role)) return res.status(400).json({ error: 'invalid role' })

  const normalizedEmail = email.toLowerCase().trim()
  const exists = await User.findOne({ email: normalizedEmail })
  if (exists) return res.status(409).json({ error: 'email exists' })

  // Default to the part before '@' if password not provided
  const emailLocal = normalizedEmail.split('@')[0]
  const initialPassword = (password && password.trim()) || emailLocal
  if (!initialPassword) return res.status(400).json({ error: 'unable to derive initial password from email' })

  const passwordHash = await bcrypt.hash(initialPassword, 10)

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    role,
    department,
    passwordHash,
    mustChangePassword: true // force change on first login
  })

  return res.status(201).json({ id: user._id, role: user.role, mustChangePassword: user.mustChangePassword })
}

export async function getApplicationStats(req, res) {
  const [submitted, accepted, rejected] = await Promise.all([
    StudentApplication.countDocuments({ status: 'submitted' }),
    StudentApplication.countDocuments({ status: 'accepted' }),
    StudentApplication.countDocuments({ status: 'rejected' })
  ])
  return res.json({
    total: submitted + accepted + rejected,
    accepted,
    rejected
  })
}

// List HODs for selection
export async function listHods(req, res) {
  const rows = await User.find({ role: 'hod' })
    .select('_id name email department')
    .sort({ name: 1 })
    .lean()
  res.json(rows)
}

// Create single project (docLink OR GridFS file)
export async function createProjectByAdmin(req, res) {
  const { title, description, whatToDo, techStack, department, hodId, docLink } = req.body || {}
  if (!title || !department) return res.status(400).json({ error: 'title and department are required' })

  // prefer GridFS file if uploaded
  let finalDocLink = ''
  let docFileId = null
  let docFileName = ''
  let docFileMime = ''

  // upload.js (uploadDoc.single) sets req.file.id and originalname/mimetype/size
  if (req.file?.id) {
    docFileId = req.file.id
    docFileName = req.file.originalname
    docFileMime = req.file.mimetype
    finalDocLink = `/files/${docFileId}`
  } else if (docLink && /^https?:\/\//i.test(docLink)) {
    finalDocLink = docLink.trim()
  }

  let assignedHod = null
  if (hodId) {
    const hod = await User.findOne({ _id: hodId, role: 'hod' }).lean()
    if (!hod) return res.status(400).json({ error: 'invalid HOD' })
    if (hod.department !== department) return res.status(400).json({ error: 'HOD and project department mismatch' })
    assignedHod = hod._id
  }

  const proj = await Project.create({
    department,
    title: title.trim(),
    description: (description || '').trim(),
    whatToDo: (whatToDo || '').trim(),
    techStack: (techStack || '').trim(),
    docLink: finalDocLink,
    docFileId,
    docFileName,
    docFileMime,
    assignedHod,
    createdBy: req.user.sub
  })

  res.status(201).json({ id: proj._id, docUrl: finalDocLink })
}

// List projects (optionally by department)
export async function listProjectsAdmin(req, res) {
  const q = {}
  if (req.query.department) q.department = req.query.department
  const rows = await Project.find(q)
    .populate('assignedHod', 'name email department')
    .sort({ createdAt: -1 })
    .lean()
  res.json(rows)
}

// Assign/Change HOD for a project
export async function assignProjectToHod(req, res) {
  const { id } = req.params
  const { hodId } = req.body || {}
  if (!hodId) return res.status(400).json({ error: 'hodId required' })
  const hod = await User.findOne({ _id: hodId, role: 'hod' }).lean()
  if (!hod) return res.status(400).json({ error: 'invalid HOD' })

  const proj = await Project.findById(id)
  if (!proj) return res.status(404).json({ error: 'project not found' })
  if (proj.department !== hod.department) return res.status(400).json({ error: 'department mismatch' })

  proj.assignedHod = hod._id
  await proj.save()
  res.json({ id: proj._id, assignedHod: hod._id })
}

// Bulk upload via Excel
// Expected headers: Title, Description, WhatToDo, TechStack, DocUrl, Department
export async function bulkUploadProjectsExcel(req, res) {
  if (!req.file) return res.status(400).json({ error: 'excel file required' })
  const { hodId } = req.body || {}

  let hod = null
  if (hodId) {
    hod = await User.findOne({ _id: hodId, role: 'hod' }).lean()
    if (!hod) return res.status(400).json({ error: 'invalid HOD' })
  }

  const wb = xlsx.read(req.file.buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet)

  let created = 0
  for (const r of rows) {
    const title = String(r.Title || '').trim()
    const department = String(r.Department || '').trim()
    if (!title || !department) continue
    const description = String(r.Description || '').trim()
    const whatToDo = String(r.WhatToDo || '').trim()
    const techStack = String(r.TechStack || '').trim()
    const docUrl = String(r.DocUrl || '').trim()
    const finalDocLink = /^https?:\/\//i.test(docUrl) ? docUrl : ''

    // If HOD provided, enforce department check
    if (hod && hod.department !== department) continue

    await Project.create({
      department,
      title,
      description,
      whatToDo,
      techStack,
      docLink: finalDocLink,
      createdBy: req.user.sub,
      assignedHod: hod ? hod._id : null
    })
    created++
  }

  res.json({ created })
}