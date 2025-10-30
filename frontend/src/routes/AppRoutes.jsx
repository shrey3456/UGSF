import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../components/login'
import Register from '../components/Register'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminRegisterUser from '../components/AdminRegisterUser'

import RoleRedirect from './RoleRedirect'
import { getDashboardPath } from './paths'

import AdminDashboard from '../pages/Admin/Dashboard'
import HODDashboard from '../pages/HOD/Dashboard'
import FacultyDashboard from '../pages/Faculty/Dashboard'
import StudentDashboard from '../pages/Student/Dashboard'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Landing -> role-based dashboard or login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin tools */}
      <Route
        path="/admin/create-user"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminRegisterUser />
          </ProtectedRoute>
        }
      />

      {/* Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/dashboard"
        element={
          <ProtectedRoute roles={['hod']}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute roles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Role-based redirect utility */}
      <Route path="/me" element={<RoleRedirect />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}