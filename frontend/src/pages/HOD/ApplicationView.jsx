import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHodApplication, setHodApplicationStatus } from '../../api/hod'

const API_BASE = import.meta.env.VITE_API_URL || ''

function makeAbsolute(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

export default function HODApplicationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getHodApplication(id)
      .then(d => { if (mounted) setApp(d) })
      .catch(e => { if (mounted) setError(e.message) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  async function updateStatus(status) {
    try {
      setError('')
      await setHodApplicationStatus(id, status, note || undefined)
      const updated = await getHodApplication(id)
      setApp(updated)
      setNote('')
    } catch (e) {
      setError(e.message)
    }
  }

  const docs = app?.documents || {}
  const docLink = (d) => makeAbsolute(d?.url || null) // served via /files/:id, opens inline in browser

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <button className="text-slate-600 hover:text-slate-800 underline" onClick={() => navigate(-1)}>Back</button>
        <h1 className="text-xl font-semibold">Application Details</h1>
        {loading ? 'Loading...' : error ? (
          <div className="text-red-600">{error}</div>
        ) : !app ? (
          <div>Not found</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" value={app.name} />
              <Field label="Email" value={app.email} />
              <Field label="Father Name" value={app.fatherName} />
              <Field label="Department" value={app.department} />
              <Field label="CGPA" value={app.cgpa ?? '—'} />
              <Field label="Father Income" value={app.fatherIncome ?? '—'} />
              <Field label="Status" value={app.status === 'submitted' ? 'pending' : app.status} />
              <Field label="Submitted" value={new Date(app.createdAt).toLocaleString()} />
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-medium mb-2">Documents</h2>
              <ul className="space-y-2">
                {[
                  ['Aadhar Card', docs.aadharCard],
                  ['Income Certificate', docs.incomeCertificate],
                  ['Resume', docs.resume],
                  ['Result Sheet', docs.resultsheet]
                ].map(([label, d]) => (
                  <li key={label} className="flex items-center justify-between border rounded px-3 py-2">
                    <span className="text-slate-700">{label}</span>
                    {docLink(d) ? (
                      <a
                        href={docLink(d)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-2">Viewing opens in a new tab. Downloads are not forced.</p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-sm text-slate-700">Note (optional)</label>
              <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={note} onChange={e => setNote(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => updateStatus('accepted')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg">
                  Approve
                </button>
                <button onClick={() => updateStatus('rejected')} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg">
                  Reject
                </button>
                <button onClick={() => updateStatus('submitted')} className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg">
                  Mark Pending
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-800">{value}</div>
    </div>
  )
}