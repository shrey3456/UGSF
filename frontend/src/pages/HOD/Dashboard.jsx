import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getHodApplications } from '../../api/hod'

export default function HODDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('pending') // pending | accepted | rejected | all

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getHodApplications(filter === 'all' ? {} : { status: filter })
      .then(data => { if (mounted) setApps(data) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [filter])

  const pill = s => ({
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }[s] || 'bg-slate-100 text-slate-700')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">HOD Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>
      <main className="p-6 space-y-4">
        <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-700 font-medium">Department: {user?.department || '—'}</div>
            <div className="text-slate-500 text-sm">Review student applications</div>
          </div>
          <div className="inline-flex border rounded-md overflow-hidden">
            {['pending','accepted','rejected','all'].map(f => (
              <button key={f}
                className={`px-3 py-1.5 ${filter===f ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Submitted</th>
                <th className="text-left px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-3" colSpan={5}>Loading...</td></tr>
              ) : apps.length === 0 ? (
                <tr><td className="px-4 py-3" colSpan={5}>No applications</td></tr>
              ) : apps.map(a => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2">{a.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${pill(a.status)}`}>
                      {a.status === 'submitted' ? 'pending' : a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-emerald-700 hover:text-emerald-900 underline"
                      onClick={() => navigate(`/hod/applications/${a._id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}