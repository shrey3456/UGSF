import bcrypt from 'bcryptjs'
import User from '../models/User.js'

export async function createUserByAdmin(req, res) {
  const { name, email, password, role, department } = req.body
  if (!name || !email || !role) return res.status(400).json({ error: 'missing fields' })
  if (!['hod', 'faculty'].includes(role)) return res.status(400).json({ error: 'invalid role' })

  const exists = await User.findOne({ email })
  if (exists) return res.status(409).json({ error: 'email exists' })

  const initialPassword = password || 'changeme'
  const passwordHash = await bcrypt.hash(initialPassword, 10)

  const user = await User.create({
    name,
    email,
    role,
    department,
    passwordHash,
    mustChangePassword: true // force change on first login
  })

  // Optionally, you can send the initial password by email from here.
  return res.status(201).json({ id: user._id, role: user.role, mustChangePassword: user.mustChangePassword })
}