import React, { useState } from 'react'
import { createMyApplication, uploadApplicationDocument } from '../../api/applications'
import { useNavigate } from 'react-router-dom'

const DEPARTMENTS = ['IT', 'CE', 'CSE', 'ME', 'CIVIL', 'EE', 'EC', 'AIML']

export default function ApplicationForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    fatherName: '',
    cgpa: '',
    fatherIncome: '',
    department: ''
  })
  const [files, setFiles] = useState({
    aadharCard: null,
    incomeCertificate: null,
    resume: null,
    resultsheet: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  function onFileChange(e) {
    const { name, files: f } = e.target
    setFiles((prev) => ({ ...prev, [name]: f?.[0] || null }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.name || !form.email || !form.fatherName || !form.department) {
      return setError('Name, Email, Father Name and Department are required')
    }
    try {
      setLoading(true)
      const created = await createMyApplication({
        name: form.name,
        email: form.email,
        fatherName: form.fatherName,
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        fatherIncome: form.fatherIncome ? Number(form.fatherIncome) : undefined,
        department: form.department
      })

      const appId = created?.id
      const uploads = []
      for (const [key, file] of Object.entries(files)) {
        if (file) uploads.push(uploadApplicationDocument(appId, key, file))
      }
      if (uploads.length) await Promise.all(uploads)

      setSuccess('Application submitted.')
      setTimeout(() => navigate('/student/status'), 800)
    } catch (e2) {
      setError(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Submit Application</h1>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First: Name and Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input name="name" className="w-full border rounded-lg px-3 py-2" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" className="w-full border rounded-lg px-3 py-2" value={form.email} onChange={onChange} required />
          </div>

          {/* Then other fields */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Father Name</label>
            <input name="fatherName" className="w-full border rounded-lg px-3 py-2" value={form.fatherName} onChange={onChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CGPA</label>
            <input name="cgpa" type="number" step="0.01" min="0" max="10" className="w-full border rounded-lg px-3 py-2" value={form.cgpa} onChange={onChange} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Father Income</label>
            <input name="fatherIncome" type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.fatherIncome} onChange={onChange} />
          </div>

          {/* Department (select from fixed list) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Department</label>
            <select
              name="department"
              className="w-full border rounded-lg px-3 py-2"
              value={form.department}
              onChange={onChange}
              required
            >
              <option value="" disabled>Select your department</option>
              {DEPARTMENTS.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Documents */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aadhar Card (PDF/Image)</label>
              <input type="file" name="aadharCard" accept=".pdf,image/*" onChange={onFileChange} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Income Certificate (PDF/Image)</label>
              <input type="file" name="incomeCertificate" accept=".pdf,image/*" onChange={onFileChange} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resume (PDF)</label>
              <input type="file" name="resume" accept=".pdf" onChange={onFileChange} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Result Sheet (PDF/Image)</label>
              <input type="file" name="resultsheet" accept=".pdf,image/*" onChange={onFileChange} className="w-full" />
            </div>
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          {success && <div className="md:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}

          <div className="md:col-span-2">
            <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}