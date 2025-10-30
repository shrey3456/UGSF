import { apiFetch } from './client'

export function adminCreateUser({ name, email, role, password, department }) {
  return apiFetch('/admin/users', { method: 'POST', body: { name, email, role, password, department } })
}

// Stats endpoint (will fallback to dummy if backend not ready)
export function getApplicationStats() {
  return apiFetch('/admin/applications/stats', { method: 'GET' })
}