// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import toast from 'react-hot-toast'
import { Settings, Clock, Moon, Save } from 'lucide-react'
import { LoadingPage, Spinner, Alert } from '../components/ui'
import { useAuthStore } from '../store/authStore'

export default function SettingsPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuthStore()
  const [local, setLocal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get().then(r => r.data),
    onSuccess: (d) => setLocal(d),
  })

  // Initialise local state when data arrives
  const settings = local || data

  const updateMut = useMutation({
    mutationFn: async (bundle) => {
      const entries = Object.entries(bundle)
      for (const [key, value] of entries) {
        await api.settings.update(key, { value: String(value) })
      }
    },
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  if (isLoading || !settings) return <LoadingPage />

  const set = (k) => (e) => setLocal({ ...settings, [k]: e.target.value })

  const handleSave = () => {
    updateMut.mutate({
      lecturer_available_start_time: settings.lecturer_available_start_time,
      lecturer_available_end_time: settings.lecturer_available_end_time,
      friday_prayer_start: settings.friday_prayer_start,
      friday_prayer_end: settings.friday_prayer_end,
      slot_duration_minutes: settings.slot_duration_minutes,
      current_academic_year: settings.current_academic_year,
      current_semester: settings.current_semester,
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-sua-600" />
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="text-sm text-gray-500">Admin-controlled timetabling constraints</p>
        </div>
      </div>

      {!isAdmin() && (
        <Alert type="warning" title="Read-only">You need Admin role to change settings.</Alert>
      )}

      <div className="space-y-6 mt-6">
        {/* Lecturer Window */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-sua-600" />
            <h2 className="section-title">Lecturer Scheduling Window</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Lecturers will ONLY be scheduled within this time range. Hard constraint — no exceptions.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={settings.lecturer_available_start_time} onChange={set('lecturer_available_start_time')} disabled={!isAdmin()} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={settings.lecturer_available_end_time} onChange={set('lecturer_available_end_time')} disabled={!isAdmin()} />
            </div>
          </div>
        </div>

        {/* Friday Prayer */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={18} className="text-amber-600" />
            <h2 className="section-title">Friday Prayer Block</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            No classes will be scheduled on Fridays during this period. Hard constraint.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prayer Start</label>
              <input type="time" className="input" value={settings.friday_prayer_start} onChange={set('friday_prayer_start')} disabled={!isAdmin()} />
            </div>
            <div>
              <label className="label">Prayer End</label>
              <input type="time" className="input" value={settings.friday_prayer_end} onChange={set('friday_prayer_end')} disabled={!isAdmin()} />
            </div>
          </div>
        </div>

        {/* Slot duration & Academic year */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Academic Configuration</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Slot Duration (min)</label>
              <input type="number" className="input" min={30} max={120} step={5}
                value={settings.slot_duration_minutes} onChange={set('slot_duration_minutes')} disabled={!isAdmin()} />
            </div>
            <div>
              <label className="label">Academic Year</label>
              <input type="text" className="input" placeholder="2024/2025"
                value={settings.current_academic_year} onChange={set('current_academic_year')} disabled={!isAdmin()} />
            </div>
            <div>
              <label className="label">Current Semester</label>
              <select className="input" value={settings.current_semester} onChange={set('current_semester')} disabled={!isAdmin()}>
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>
          </div>
        </div>

        {isAdmin() && (
          <button className="btn-primary px-8 py-2.5" onClick={handleSave} disabled={updateMut.isPending}>
            {updateMut.isPending ? <><Spinner size="sm" /> Saving…</> : <><Save size={16} /> Save Settings</>}
          </button>
        )}
      </div>
    </div>
  )
}
