import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState({ exists: false, status: 'none', message: '', lastUpdate: null })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const d = await getMyApplication()
        if (mounted) setApp(d)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const statusStyles = {
    none: 'bg-slate-100 text-slate-700',
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Student Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Recent message / status */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Application Status</h2>
            <span className={`px-2 py-1 rounded text-xs ${statusStyles[app.status]}`}>
              {app.status === 'none' ? 'no application' : app.status}
            </span>
          </div>
          <p className="text-slate-600 mt-2">
            {loading ? 'Loading...' : (app.message || 'No updates yet.')}
          </p>
          {app.lastUpdate && (
            <p className="text-xs text-slate-400 mt-1">Last update: {new Date(app.lastUpdate).toLocaleString()}</p>
          )}
        </section>

        {/* Actions: Add / Track */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-base font-semibold mb-2">Add Application</h3>
            <p className="text-sm text-slate-600 mb-4">Submit your application.</p>
            <button onClick={() => navigate('/student/apply')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg">
              {app.exists && app.status !== 'rejected' ? 'Update Application' : 'Add Application'}
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-base font-semibold mb-2">Track Application</h3>
            <p className="text-sm text-slate-600 mb-4">Check your current status.</p>
            <button onClick={() => navigate('/student/status')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg">
              View Status
            </button>
          </div>
        </section>

        {/* Conditional: show only after approval */}
        {app.status === 'accepted' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-base font-semibold mb-2">Faculty</h3>
              <p className="text-sm text-slate-600 mb-4">View assigned faculty.</p>
              <button onClick={() => navigate('/student/faculty')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg">
                Open Faculty
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-base font-semibold mb-2">Weekly Tasks</h3>
              <p className="text-sm text-slate-600 mb-4">Track weekly tasks.</p>
              <button onClick={() => navigate('/student/tasks')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg">
                Open Weekly Tasks
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}