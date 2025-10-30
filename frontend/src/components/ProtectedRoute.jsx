import React from 'react'
import { Navigate } from 'react-router-dom'
import { getToken, getRole } from '../store/authStore'

export default function ProtectedRoute({ roles = [], children }) {
  const token = getToken()
  const role = getRole()
  if (!token) return <Navigate to="/login" replace />
  if (roles.length && !roles.includes(role)) return <Navigate to="/login" replace />
  return children
}