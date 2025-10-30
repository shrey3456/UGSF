import React, { useState, useEffect } from 'react'
import { adminCreateUser } from '../api/admin'

export default function AdminRegisterUser() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('hod')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('') // optional; backend defaults to 'changeme' if empty
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedRole = localStorage.getItem('role')
    if (storedRole !== 'admin') {
      window.location.assign('/login')
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name || !email || !role) return setError('Name, email and role are required')
    if (!['hod','faculty'].includes(role)) return setError('Role must be HOD or Faculty')
    try {
      setLoading(true)
      const resp = await adminCreateUser({ name, email, role, password, department })
      setSuccess(`Created ${resp?.id} (${resp?.role}). They must change password on first login.`)
      setName(''); setEmail(''); setPassword(''); setDepartment('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6">Create HOD / Faculty</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select className="w-full border rounded-lg px-3 py-2" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="hod">HOD</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department (optional)</label>
            <input className="w-full border rounded-lg px-3 py-2" value={department} onChange={e=>setDepartment(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Initial Password (optional)</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Leave blank to use 'changeme'" value={password} onChange={e=>setPassword(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">First login will require password change automatically.</p>
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}

          <div className="md:col-span-2">
            <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}