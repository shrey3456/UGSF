import { apiFetch } from './client'
import { getToken } from '../store/authStore'
const API = import.meta.env.VITE_API_URL || ''

const auth = () => ({ Authorization: `Bearer ${getToken()}` })

export function adminCreateUser({ name, email, role, password, department }) {
  return apiFetch('/admin/users', { method: 'POST', body: { name, email, role, password, department } })
}

// Stats endpoint (will fallback to dummy if backend not ready)
export function getApplicationStats() {
  return apiFetch('/admin/applications/stats', { method: 'GET' })
}

export async function listAdminHods() {
  const r = await fetch(`${API}/admin/hods`, { headers: auth() })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function listAdminProjects(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const r = await fetch(`${API}/admin/projects${qs ? `?${qs}` : ''}`, { headers: auth() })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function createAdminProject(formData) {
  const r = await fetch(`${API}/admin/projects`, { method: 'POST', headers: auth(), body: formData })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function assignAdminProject(projectId, hodId) {
  const r = await fetch(`${API}/admin/projects/${projectId}/assign-hod`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ hodId })
  })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function bulkProjectsExcel(file, hodId) {
  const fd = new FormData()
  fd.append('excel', file)
  if (hodId) fd.append('hodId', hodId)
  const r = await fetch(`${API}/admin/projects/bulk-excel`, { method: 'POST', headers: auth(), body: fd })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}