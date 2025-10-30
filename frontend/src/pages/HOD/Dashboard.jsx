import React from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function HODDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">HOD Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>
      <main className="p-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-medium mb-2">Welcome HOD{user?.name ? `, ${user.name}` : ''}!</h2>
          <p className="text-slate-600">This is your HOD dashboard.</p>
        </div>
      </main>
    </div>
  )
}