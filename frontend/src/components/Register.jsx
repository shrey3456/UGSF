import React, { useState } from 'react'
import { registerApi } from '../api/auth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name || !email || !password) return setError('All fields are required')
    if (password !== confirm) return setError('Passwords do not match')

    try {
      setLoading(true)
      await registerApi({ name, email, password }) // role is enforced as 'student' on backend
      setSuccess('Registration successful. Redirecting to login...')
      setTimeout(() => window.location.assign('/login'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-3xl shadow-2xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Student Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-purple-200 mb-2">Name</label>
            <input
              type="text"
              className="w-full rounded-xl bg-white/5 text-white placeholder-purple-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-3"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-2">Email</label>
            <input
              type="email"
              className="w-full rounded-xl bg-white/5 text-white placeholder-purple-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-3"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-2">Password</label>
            <input
              type="password"
              className="w-full rounded-xl bg-white/5 text-white placeholder-purple-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-3"
              placeholder="Choose a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-2">Confirm password</label>
            <input
              type="password"
              className="w-full rounded-xl bg-white/5 text-white placeholder-purple-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 px-3 py-3"
              placeholder="Re-enter password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <div className="text-sm text-red-200 bg-red-500/20 border border-red-400 rounded p-2">{error}</div>}
          {success && <div className="text-sm text-green-200 bg-green-500/20 border border-green-400 rounded p-2">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-300 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-purple-200 mt-6 text-center">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-white hover:text-purple-300">Sign in</a>
        </p>
      </div>
    </div>
  )
}