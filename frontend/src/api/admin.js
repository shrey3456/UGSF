import { apiFetch } from './client'

export function adminCreateUser({ name, email, role, password, department }) {
  return apiFetch('/admin/users', { method: 'POST', body: { name, email, role, password, department } })
}