// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { GraduationCap, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sua-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center">
            <GraduationCap size={20} className="text-sua-900" />
          </div>
          <span className="text-white font-display font-semibold text-lg">SUA-TGS</span>
        </div>

        <div>
          <h1 className="text-white text-4xl font-display font-bold leading-tight mb-4">
            Timetable Generation<br />System
          </h1>
          <p className="text-sua-200 text-lg leading-relaxed mb-8">
            Sokoine University of Agriculture's intelligent scheduling platform.
            Automatically generate conflict-free timetables respecting all
            academic constraints.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Campuses', value: '2' },
              { label: 'Constraint Types', value: '8+' },
              { label: 'Scheduling', value: 'Auto' },
              { label: 'Export Ready', value: 'Yes' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-sua-700 rounded-xl p-4">
                <p className="text-gold-400 text-2xl font-display font-bold">{value}</p>
                <p className="text-sua-300 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sua-400 text-sm">© {new Date().getFullYear()} Sokoine University of Agriculture · Morogoro, Tanzania</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-sua-600 flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-display font-semibold text-gray-900">SUA Timetable System</span>
          </div>

          <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  type="text"
                  placeholder="your.username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9 pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8">
            Default admin: <span className="font-mono font-medium text-gray-600">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
