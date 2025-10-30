import React, { useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import AdminRegisterUser from '../../components/AdminRegisterUser'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  // Buttons for the register form
  const [selectedRole, setSelectedRole] = useState('hod') // 'hod' | 'faculty'

  // Stats card state
  const [showStats, setShowStats] = useState(false)
  const [statsTab, setStatsTab] = useState(null) // 'total' | 'status'
  const stats = { total: 12, accepted: 5, rejected: 2 } // dummy numbers

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

      <main className="p-6 space-y-6">
        {/* Application Stats (dummy) */}
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Applications Overview</h2>
            <div className="inline-flex rounded-md overflow-hidden border">
              <button
                className={`px-4 py-2 ${statsTab === 'total' && showStats ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                onClick={() => { setStatsTab('total'); setShowStats(true) }}
              >
                Total Applications
              </button>
              <button
                className={`px-4 py-2 ${statsTab === 'status' && showStats ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                onClick={() => { setStatsTab('status'); setShowStats(true) }}
              >
                Accepted / Rejected
              </button>
            </div>
          </div>

          {showStats && (
            <div className="rounded-xl border p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  {statsTab === 'total' ? 'Total Applications' : 'Accepted / Rejected'}
                </div>
                <button
                  onClick={() => setShowStats(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total" value={stats.total} color="indigo" />
                <StatCard title="Accepted" value={stats.accepted} color="emerald" />
                <StatCard title="Rejected" value={stats.rejected} color="rose" />
              </div>

              <p className="text-xs text-slate-400 mt-2">Demo stats (replace with API later)</p>
            </div>
          )}
        </section>

        {/* Register HOD/Faculty with two buttons and one form */}
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Register HOD / Faculty</h2>
            <div className="inline-flex rounded-md overflow-hidden border">
              <button
                className={`px-4 py-2 ${selectedRole === 'hod' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                onClick={() => setSelectedRole('hod')}
              >
                Register HOD
              </button>
              <button
                className={`px-4 py-2 ${selectedRole === 'faculty' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                onClick={() => setSelectedRole('faculty')}
              >
                Register Faculty
              </button>
            </div>
          </div>

          <AdminRegisterUser forcedRole={selectedRole} />
        </section>
      </main>
    </div>
  )
}

function StatCard({ title, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  )
}