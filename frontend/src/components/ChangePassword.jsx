import React, { useState } from 'react'
import { changePasswordApi } from '../api/auth'
import { getRole, getMustChangePassword, setAuth, getAuth } from '../store/authStore'
import { getDashboardPath } from '../routes/paths'

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!oldPassword || !newPassword) return setError('Both old and new password are required')
    if (newPassword !== confirm) return setError('Passwords do not match')
    try {
      setLoading(true)
      await changePasswordApi({ oldPassword, newPassword })
      const auth = getAuth()
      setAuth({ ...auth, mustChangePassword: false })
      setSuccess('Password updated. Redirecting...')
      const role = getRole()
      setTimeout(() => window.location.assign(getDashboardPath(role)), 700)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const must = getMustChangePassword()
  const role = getRole()
  const showNotice = must && (role === 'hod' || role === 'faculty')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold mb-1">Change Password</h1>
        {showNotice && <p className="text-sm text-slate-500 mb-4">First login requires changing your password.</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Old password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm new password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}
          <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}