import { getToken } from '../store/authStore'
const API = import.meta.env.VITE_API_URL || ''
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })

export function getHodApplications(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return fetch(`${API}/hod/applications${qs ? `?${qs}` : ''}`, { headers: headers() })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}
export function getHodApplication(id) {
  return fetch(`${API}/hod/applications/${id}`, { headers: headers() })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}
export function setHodApplicationStatus(id, status, note) {
  return fetch(`${API}/hod/applications/${id}/status`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify({ status, note })
  }).then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}

export function listDepartmentFaculties() {
  return fetch(`${API}/hod/faculties`, { headers: headers() })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}
export function listDepartmentProjects() {
  return fetch(`${API}/hod/projects`, { headers: headers() })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}
export function listEligibleStudents() {
  return fetch(`${API}/hod/eligible-students`, { headers: headers() })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}
export function assignFacultyProject(appId, payload) {
  return fetch(`${API}/hod/applications/${appId}/assign`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(payload)
  }).then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}

// Optional interviews
export function listHodInterviews(params = {}) {
  const API = import.meta.env.VITE_API_URL || ''
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const qs = new URLSearchParams(params).toString()
  return fetch(`${API}/hod/interviews${qs ? `?${qs}` : ''}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }).then(async r => {
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Failed')
    return d
  })
}
export function scheduleInterview(payload) {
  return fetch(`${API}/hod/interviews`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}
export function setInterviewResult(id, result, notes) {
  return fetch(`${API}/hod/interviews/${id}/result`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ result, notes }) })
    .then(async r => { const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Failed'); return d })
}