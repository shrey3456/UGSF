import { getToken, clearAuth } from '../store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function apiFetch(path, { method = 'GET', headers = {}, body, auth = true } = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': body ? 'application/json' : undefined,
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    clearAuth()
    throw new Error(data.error || 'Unauthorized')
  }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}