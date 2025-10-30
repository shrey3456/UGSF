import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listEligibleStudents,
  listDepartmentFaculties,
  listDepartmentProjects,
  assignFacultyProject
} from '../../api/hod'

export default function HODAssignments() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [students, setStudents] = useState([])
  const [faculties, setFaculties] = useState([])
  const [projects, setProjects] = useState([])
  // sel now holds facultyId, projectId, start, end per student
  const [sel, setSel] = useState({})
  const [savingId, setSavingId] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [stu, fac, proj] = await Promise.all([
          listEligibleStudents(),
          listDepartmentFaculties(),
          listDepartmentProjects()
        ])
        if (!mounted) return
        setStudents(stu || [])
        setFaculties(fac || [])
        setProjects(proj || [])
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [toast])

  const passedOnly = useMemo(
    () => (students || []).filter(s => (s.finalResult === 'pass') || s.status === 'accepted'),
    [students]
  )

  function setChoice(sid, patch) {
    setSel(prev => ({ ...prev, [sid]: { facultyId: '', projectId: '', start: '', end: '', ...(prev[sid]||{}), ...patch } }))
  }

  async function handleAssign(app) {
    const sid = app.student?._id || app.student
    const choice = sel[sid] || {}
    if (!choice.facultyId) return setToast('Select faculty')
    if (!choice.projectId) return setToast('Select project')
    if (!choice.start) return setToast('Select start date & time')
    if (!choice.end) return setToast('Select end date & time')

    const startISO = new Date(choice.start).toISOString()
    const endISO = new Date(choice.end).toISOString()
    if (new Date(endISO) <= new Date(startISO)) return setToast('End time must be after start time')

    const p = projects.find(x => x._id === choice.projectId)
    try {
      setSavingId(app._id)
      await assignFacultyProject(app._id, {
        facultyId: choice.facultyId,
        projectId: choice.projectId,
        projectTitle: p?.title,
        projectDescription: p?.description || '',
        startAt: startISO,
        endAt: endISO
      })
      // Remove from list
      setStudents(prev => prev.filter(row => row._id !== app._id))
      setSel(prev => { const c = { ...prev }; delete c[sid]; return c })
      setToast('Assigned successfully')
    } catch (e) {
      setToast(e.message || 'Failed to assign')
    } finally {
      setSavingId('')
      setTimeout(() => setToast(''), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Assignments</h1>
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800 underline">Back</button>
        </div>

        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}
        {error && <div className="text-rose-700">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Eligible students table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-x-auto">
            <div className="px-4 py-3 border-b text-slate-800 font-semibold">Eligible Students</div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2">Student</th>
                  <th className="text-left px-4 py-2">Faculty</th>
                  <th className="text-left px-4 py-2">Project</th>
                  <th className="text-left px-4 py-2">Start</th>
                  <th className="text-left px-4 py-2">End</th>
                  <th className="text-left px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-3" colSpan={6}>Loading...</td></tr>
                ) : passedOnly.length === 0 ? (
                  <tr><td className="px-4 py-3" colSpan={6}>No eligible students</td></tr>
                ) : passedOnly.map(app => {
                  const sid = (app.student?._id || app.student)
                  const choice = sel[sid] || { facultyId: '', projectId: '', start: '', end: '' }
                  return (
                    <tr key={app._id} className="border-t">
                      <td className="px-4 py-2">{app.name} ({app.email})</td>
                      <td className="px-4 py-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={choice.facultyId}
                          onChange={e => setChoice(sid, { facultyId: e.target.value })}
                        >
                          <option value="">Select</option>
                          {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={choice.projectId}
                          onChange={e => setChoice(sid, { projectId: e.target.value })}
                        >
                          <option value="">Select</option>
                          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="datetime-local"
                          className="border rounded px-2 py-1"
                          value={choice.start}
                          onChange={e => setChoice(sid, { start: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="datetime-local"
                          className="border rounded px-2 py-1"
                          value={choice.end}
                          onChange={e => setChoice(sid, { end: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          disabled={savingId === app._id}
                          className="text-emerald-700 hover:text-emerald-900 underline disabled:text-slate-400"
                          onClick={() => handleAssign(app)}
                        >
                          {savingId === app._id ? 'Assigning...' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Projects and Faculties quick lists */}
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div>
              <div className="font-semibold mb-2">Projects</div>
              <ul className="space-y-1 max-h-48 overflow-auto">
                {projects.length === 0 ? (
                  <li className="text-slate-500 text-sm">No projects</li>
                ) : projects.map(p => (
                  <li key={p._id} className="text-sm">
                    <span className="font-medium">{p.title}</span>
                    {p.description && <span className="text-slate-500"> — {p.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Faculties</div>
              <ul className="space-y-1 max-h-48 overflow-auto">
                {faculties.length === 0 ? (
                  <li className="text-slate-500 text-sm">No faculties</li>
                ) : faculties.map(f => (
                  <li key={f._id} className="text-sm">{f.name} ({f.email})</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}