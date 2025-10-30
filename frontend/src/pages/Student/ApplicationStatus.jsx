import React, { useEffect, useState } from 'react'
import { getMyApplication } from '../../api/applications'

export default function ApplicationStatus() {
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getMyApplication()
        if (mounted) setState({ loading: false, data, error: '' })
      } catch (e) {
        if (mounted) setState({ loading: false, data: null, error: e.message })
      }
    })()
    return () => { mounted = false }
  }, [])

  const d = state.data
  const status = d?.status || 'none'
  const pill = {
    none: 'bg-slate-100 text-slate-700',
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }[status]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Application Status</h1>
        {state.loading ? 'Loading...' : state.error ? (
          <div className="text-red-600">{state.error}</div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs ${pill}`}>{status}</span>
              {d?.department && <span className="text-xs text-slate-500">Department: {d.department}</span>}
            </div>
            <p className="text-slate-700 mt-3">{d?.message || 'No updates yet.'}</p>
            {d?.assignedHod && (
              <div className="mt-4 text-sm text-slate-600">
                Assigned HOD: {d.assignedHod.name} ({d.assignedHod.email})
              </div>
            )}
            {d?.lastUpdate && (
              <div className="mt-2 text-xs text-slate-400">Last update: {new Date(d.lastUpdate).toLocaleString()}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}