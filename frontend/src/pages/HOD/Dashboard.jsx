import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getHodApplications, } from '../../api/hod'
import { scheduleInterview, listHodInterviews, setInterviewResult } from '../../api/hod'

export default function HODDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('pending') // pending | accepted | rejected | all
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null) // selected application row
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', mode: 'online', meetingUrl: '', location: '', notes: '' })
  const [formErr, setFormErr] = useState('')
  const [toast, setToast] = useState('')
  const [pendingInterviews, setPendingInterviews] = useState([])
  const [completedInterviews, setCompletedInterviews] = useState([])
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [resultSaving, setResultSaving] = useState(false)
  const [resultForm, setResultForm] = useState({ result: 'pass', notes: '' })

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

  async function loadInterviews() {
    try {
      const [pending, completed] = await Promise.all([
        listHodInterviews({ status: 'pending' }),
        listHodInterviews({ status: 'completed', limit: 10 })
      ])
      setPendingInterviews(pending || [])
      setCompletedInterviews(completed || [])
    } catch {}
  }

  useEffect(() => { loadInterviews() }, [])
  useEffect(() => { if (toast) loadInterviews() }, [toast])

  const completedAppIds = new Set(
    (completedInterviews || []).map(iv => (iv.application?._id || iv.application)).filter(Boolean)
  )

  function openSchedule(app) {
    setSelected(app)
    setForm({ date: '', time: '', mode: 'online', meetingUrl: '', location: '', notes: '' })
    setFormErr('')
    setModalOpen(true)
  }

  function combineISO(d, t) {
    if (!d || !t) return null
    return new Date(`${d}T${t}:00`)
  }

  async function submitSchedule(e) {
    e.preventDefault()
    setFormErr('')
    const when = combineISO(form.date, form.time)
    if (!when) return setFormErr('Select date and time')
    if (when.getTime() <= Date.now()) return setFormErr('Selected time must be in the future')
    if (form.mode === 'online' && !/^https?:\/\//i.test(form.meetingUrl || '')) return setFormErr('Enter a valid meeting link (https://...)')
    if (form.mode === 'offline' && !form.location.trim()) return setFormErr('Enter a venue for offline interview')

    try {
      setSaving(true)
      await scheduleInterview({
        applicationId: selected._id,
        scheduledAt: when.toISOString(),
        mode: form.mode,
        meetingUrl: form.mode === 'online' ? form.meetingUrl : undefined,
        location: form.mode === 'offline' ? form.location : undefined,
        notes: form.notes || undefined
      })
      setModalOpen(false)
      setToast('Interview scheduled')
      // refresh current list if needed
      setLoading(true)
      getHodApplications(filter === 'all' ? {} : { status: filter })
        .then(data => setApps(data))
        .finally(() => setLoading(false))
      setTimeout(() => setToast(''), 2000)
    } catch (e) {
      setFormErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const pill = s => ({
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }[s] || 'bg-slate-100 text-slate-700')

  function openResultModal(iv) {
    setSelectedInterview(iv)
    setResultForm({ result: 'pass', notes: '' })
    setResultModalOpen(true)
  }

  async function submitResult(e) {
    e.preventDefault()
    if (!selectedInterview) return
    try {
      setResultSaving(true)
      await setInterviewResult(selectedInterview._id, resultForm.result, resultForm.notes || undefined)
      // Remove from pending list immediately
      setPendingInterviews(prev => prev.filter(x => x._id !== selectedInterview._id))
      // Add to completed cache (optional)
      setCompletedInterviews(prev => ([...prev, { ...selectedInterview, result: resultForm.result }]))
      setResultModalOpen(false)
      setToast('Result saved')
      setTimeout(() => setToast(''), 1500)
    } catch (e) {
      alert(e.message)
    } finally {
      setResultSaving(false)
    }
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

      <main className="p-6 space-y-4">
        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}

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
                  <td className="px-4 py-2 space-x-3">
                    <button
                      className="text-emerald-700 hover:text-emerald-900 underline"
                      onClick={() => navigate(`/hod/applications/${a._id}`)}
                    >
                      View
                    </button>
                    {a.status === 'accepted' && !completedAppIds.has(a._id) && (
                      <button
                        className="text-slate-700 hover:text-slate-900 underline"
                        onClick={() => openSchedule(a)}
                      >
                        Schedule Interview
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal: Schedule Interview */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Schedule Interview</h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <form onSubmit={submitSchedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Date</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2"
                      value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Time</label>
                    <input type="time" className="w-full border rounded-lg px-3 py-2"
                      value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" value="online"
                      checked={form.mode==='online'}
                      onChange={e=>setForm(f=>({...f,mode:e.target.value}))}
                    />
                    <span>Online</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" value="offline"
                      checked={form.mode==='offline'}
                      onChange={e=>setForm(f=>({...f,mode:e.target.value}))}
                    />
                    <span>Offline</span>
                  </label>
                </div>

                {form.mode === 'online' ? (
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Meeting link</label>
                    <input type="url" placeholder="https://meet.google.com/..." className="w-full border rounded-lg px-3 py-2"
                      value={form.meetingUrl} onChange={e=>setForm(f=>({...f,meetingUrl:e.target.value}))}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Venue</label>
                    <input type="text" placeholder="Room 301, Main Building" className="w-full border rounded-lg px-3 py-2"
                      value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Notes (optional)</label>
                  <textarea rows={2} className="w-full border rounded-lg px-3 py-2"
                    value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                  />
                </div>

                {formErr && <div className="text-red-600 text-sm">{formErr}</div>}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pending Interviews */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Pending Interviews</h2>
            <button className="text-slate-600 hover:text-slate-800 underline text-sm" onClick={loadInterviews}>Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2">Student</th>
                  <th className="text-left px-4 py-2">When</th>
                  <th className="text-left px-4 py-2">Mode</th>
                  <th className="text-left px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pendingInterviews.length === 0 ? (
                  <tr><td className="px-4 py-3" colSpan={4}>No pending interviews</td></tr>
                ) : pendingInterviews.map(iv => (
                  <tr key={iv._id} className="border-t">
                    <td className="px-4 py-2">{iv.student?.name} ({iv.student?.email})</td>
                    <td className="px-4 py-2">{new Date(iv.scheduledAt).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{iv.mode}</td>
                    <td className="px-4 py-2">
                      <button className="text-emerald-700 hover:text-emerald-900 underline" onClick={() => openResultModal(iv)}>
                        Set Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Interviews (last 10) */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Recent Interviews</h2>
            <button className="text-slate-600 hover:text-slate-800 underline text-sm" onClick={loadInterviews}>Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2">Student</th>
                  <th className="text-left px-4 py-2">When</th>
                  <th className="text-left px-4 py-2">Result</th>
                  <th className="text-left px-4 py-2">Notes</th>
                  <th className="text-left px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {completedInterviews.length === 0 ? (
                  <tr><td className="px-4 py-3" colSpan={5}>No recent interviews</td></tr>
                ) : completedInterviews.map(iv => (
                  <tr key={iv._id} className="border-t">
                    <td className="px-4 py-2">{iv.student?.name} ({iv.student?.email})</td>
                    <td className="px-4 py-2">{new Date(iv.scoredAt || iv.scheduledAt).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded ${iv.result === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {iv.result}
                      </span>
                    </td>
                    <td className="px-4 py-2">{iv.notes || '—'}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-slate-700 hover:text-slate-900 underline"
                        onClick={() => navigate(`/hod/applications/${iv.application?._id || ''}`)}
                        disabled={!iv.application?._id}
                      >
                        View Application
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal: Set Interview Result */}
        {resultModalOpen && selectedInterview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setResultModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Set Interview Result</h2>
                <button onClick={() => setResultModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <form onSubmit={submitResult} className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="ivresult" value="pass"
                      checked={resultForm.result === 'pass'}
                      onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}
                    />
                    <span>Pass</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="ivresult" value="fail"
                      checked={resultForm.result === 'fail'}
                      onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}
                    />
                    <span>Fail</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Notes (optional)</label>
                  <textarea rows={2} className="w-full border rounded-lg px-3 py-2"
                    value={resultForm.notes} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setResultModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button type="submit" disabled={resultSaving}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60">
                    {resultSaving ? 'Saving...' : 'Save Result'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}