import React from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate, Link } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>
      <main className="p-6 space-y-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-medium mb-2">Welcome Admin{user?.name ? `, ${user.name}` : ''}!</h2>
          <p className="text-slate-600 mb-4">Manage HOD and Faculty accounts.</p>
          <Link to="/admin/create-user" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg">
            Create HOD / Faculty
          </Link>
        </div>
      </main>
    </div>
  )
}