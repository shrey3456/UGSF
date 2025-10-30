import { apiFetch } from './client'

export function getHodApplications(params = {}) {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`/hod/applications${q ? `?${q}` : ''}`, { method: 'GET' })
}
export function getHodApplication(id) {
  return apiFetch(`/hod/applications/${id}`, { method: 'GET' })
}
export function setHodApplicationStatus(id, status, note) {
  return apiFetch(`/hod/applications/${id}/status`, { method: 'PATCH', body: { status, note } })
}