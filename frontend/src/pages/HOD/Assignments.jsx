// import React, { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { listEligibleStudents, listDepartmentFaculties, listDepartmentProjects, createDepartmentProject, assignFacultyProject } from '../../api/hod'

// export default function HODAssignments() {
//   const navigate = useNavigate()
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [students, setStudents] = useState([])
//   const [faculties, setFaculties] = useState([])
//   const [projects, setProjects] = useState([])
//   const [assign, setAssign] = useState({}) // studentId -> { facultyId, projectId }
//   const [savingId, setSavingId] = useState('')
//   const [pForm, setPForm] = useState({ title: '', description: '' })
//   const [pSaving, setPSaving] = useState(false)
//   const [toast, setToast] = useState('')

//   useEffect(() => {
//     let mounted = true
//     ;(async () => {
//       try {
//         setLoading(true)
//         const [stu, fac, proj] = await Promise.all([
//           listEligibleStudents(),
//           listDepartmentFaculties(),
//           listDepartmentProjects()
//         ])
//         if (!mounted) return
//         setStudents(stu || [])
//         setFaculties(fac || [])
//         setProjects(proj || [])
//       } catch (e) {
//         if (mounted) setError(e.message || String(e))
//       } finally {
//         if (mounted) setLoading(false)
//       }
//     })()
//     return () => { mounted = false }
//   }, [toast])

//   const handleAssign = async (appId, studentId) => {
//     const sel = assign[studentId] || {}
//     if (!sel.facultyId) return setToast('Select faculty first')
//     if (!sel.projectId) return setToast('Select project first')
//     try {
//       setSavingId(appId)
//       const proj = projects.find(p => p._id === sel.projectId)
//       await assignFacultyProject(appId, {
//         facultyId: sel.facultyId,
//         projectTitle: proj?.title,
//         projectDescription: proj?.description
//       })
//       setToast('Assigned successfully')
//       setTimeout(() => setToast(''), 1500)
//     } catch (e) {
//       setToast(e.message || 'Failed')
//     } finally {
//       setSavingId('')
//     }
//   }

//   async function createProjectNow(e) {
//     e.preventDefault()
//     if (!pForm.title.trim()) return
//     try {
//       setPSaving(true)
//       await createDepartmentProject({ title: pForm.title.trim(), description: pForm.description?.trim() || '' })
//       setPForm({ title: '', description: '' })
//       setToast('Project created')
//     } catch (e) {
//       setToast(e.message || 'Failed to create project')
//     } finally {
//       setPSaving(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-6">
//       <div className="max-w-6xl mx-auto space-y-4">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-semibold">Assignments</h1>
//           <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-800 underline">Back</button>
//         </div>

//         {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}
//         {error && <div className="text-rose-700">{error}</div>}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//           <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-x-auto">
//             <div className="px-4 py-3 border-b text-slate-800 font-semibold">Eligible Students</div>
//             <table className="min-w-full text-sm">
//               <thead className="bg-slate-50">
//                 <tr>
//                   <th className="text-left px-4 py-2">Student</th>
//                   <th className="text-left px-4 py-2">Faculty</th>
//                   <th className="text-left px-4 py-2">Project</th>
//                   <th className="text-left px-4 py-2"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr><td className="px-4 py-3" colSpan={4}>Loading...</td></tr>
//                 ) : students.length === 0 ? (
//                   <tr><td className="px-4 py-3" colSpan={4}>No eligible students</td></tr>
//                 ) : students.map(s => {
//                   const sid = s.student?._id || s.student
//                   const sel = assign[sid] || { facultyId: '', projectId: '' }
//                   return (
//                     <tr key={s._id} className="border-t">
//                       <td className="px-4 py-2">{s.name} ({s.email})</td>
//                       <td className="px-4 py-2">
//                         <select className="border rounded px-2 py-1"
//                           value={sel.facultyId}
//                           onChange={e => setAssign(a => ({ ...a, [sid]: { ...sel, facultyId: e.target.value } }))}
//                         >
//                           <option value="">Select</option>
//                           {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
//                         </select>
//                       </td>
//                       <td className="px-4 py-2">
//                         <select className="border rounded px-2 py-1"
//                           value={sel.projectId}
//                           onChange={e => setAssign(a => ({ ...a, [sid]: { ...sel, projectId: e.target.value } }))}
//                         >
//                           <option value="">Select</option>
//                           {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
//                         </select>
//                       </td>
//                       <td className="px-4 py-2">
//                         <button
//                           disabled={savingId === s._id}
//                           className="text-emerald-700 hover:text-emerald-900 underline disabled:text-slate-400"
//                           onClick={() => handleAssign(s._id, sid)}
//                         >
//                           {savingId === s._id ? 'Assigning...' : 'Assign'}
//                         </button>
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>

//           <div className="bg-white rounded-xl shadow p-4">
//             <div className="font-semibold mb-2">Projects (Department)</div>
//             <ul className="space-y-1 max-h-60 overflow-auto mb-3">
//               {projects.length === 0 ? (
//                 <li className="text-slate-500 text-sm">No projects</li>
//               ) : projects.map(p => (
//                 <li key={p._id} className="text-sm">
//                   <span className="font-medium">{p.title}</span>
//                   {p.description && <span className="text-slate-500"> — {p.description}</span>}
//                 </li>
//               ))}
//             </ul>
//             <form onSubmit={createProjectNow} className="space-y-2">
//               <div className="text-sm font-medium">Add Project</div>
//               <input
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Title"
//                 value={pForm.title}
//                 onChange={e => setPForm(f => ({ ...f, title: e.target.value }))}
//               />
//               <textarea
//                 rows={2}
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Description (optional)"
//                 value={pForm.description}
//                 onChange={e => setPForm(f => ({ ...f, description: e.target.value }))}
//               />
//               <button disabled={pSaving} className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded px-3 py-2">
//                 {pSaving ? 'Saving...' : 'Create'}
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }