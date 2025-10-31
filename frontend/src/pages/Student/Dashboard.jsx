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
  const statusLabel = app.status === 'submitted' ? 'pending' : app.status
  const isAccepted = app.status === 'accepted'
  const isRejected = app.status === 'rejected'
  const canEdit = app.status === 'none' || app.status === 'submitted'
  const buttonLabel = app.exists && canEdit ? 'Update Application' : 'Add Application'

  const briefMessage = (() => {
    if (loading) return 'Loading...'
    if (app?.nextInterview) {
      return `Interview scheduled on ${new Date(app.nextInterview.scheduledAt).toLocaleString()} (${app.nextInterview.mode})`
    }
    if (app.status === 'none') return 'No application submitted yet.'
    const msg = app.message || 'No updates yet.'
    return msg.length > 120 ? `${msg.slice(0, 120)}…` : msg
  })()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Back</button>
          <h1 className="text-xl font-semibold">Student Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Compact Status Summary */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium">Application Status</h2>
                <span className={`px-2 py-1 rounded text-xs ${statusStyles[app.status]}`}>
                  {app.status === 'none' ? 'no application' : statusLabel}
                </span>
              </div>
              <p className="text-slate-600 mt-2">{briefMessage}</p>
            </div>
            <button
              onClick={() => navigate('/student/status')}
              className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
            >
              Track Application
            </button>
          </div>
        </section>

        {/* Actions: Add/Update only */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-base font-semibold mb-2">Add Application</h3>
            <p className="text-sm text-slate-600 mb-4">
              {isAccepted
                ? 'Your application is approved. You cannot update it.'
                : isRejected
                ? 'Your application was rejected. You cannot submit again.'
                : 'Submit or update your application.'}
            </p>
            <button
              onClick={() => navigate('/student/apply')}
              disabled={!canEdit}
              aria-disabled={!canEdit}
              title={!canEdit ? 'Not allowed after approval/rejection' : ''}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg
                         disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              {buttonLabel}
            </button>
          </div>
          {/* ...keep any other cards you need (e.g., Faculty/Tasks after acceptance)... */}
        </section>

        {/* ...accepted-only sections remain unchanged... */}
      </main>
    </div>
  )
}