import bcrypt from 'bcryptjs'
import User from '../models/User.js'

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