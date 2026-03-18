// src/pages/GenerationPage.jsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import toast from 'react-hot-toast'
import { Zap, AlertTriangle, CheckCircle, RefreshCw, Layers, Clock } from 'lucide-react'
import { Alert, Spinner, Field } from '../components/ui'
import clsx from 'clsx'

export default function GenerationPage() {
  const qc = useQueryClient()
  const [config, setConfig] = useState({
    academic_year: '2024/2025',
    semester: 1,
    program_ids: null,
    clear_existing: false,
  })
  const [result, setResult] = useState(null)
  const [slotsResult, setSlotsResult] = useState(null)

  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => api.programs.list().then(r => r.data) })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings.get().then(r => r.data) })
  const { data: slots = [] } = useQuery({ queryKey: ['slots'], queryFn: () => api.timetable.slots.list().then(r => r.data) })

  const slotsMut = useMutation({
    mutationFn: () => api.timetable.slots.generate(),
    onSuccess: (res) => {
      setSlotsResult(res.data)
      toast.success(res.data.message)
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to generate slots'),
  })

  const generateMut = useMutation({
    mutationFn: (data) => api.timetable.generate(data),
    onSuccess: (res) => {
      setResult(res.data)
      toast.success(res.data.message)
      qc.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (e) => {
      toast.error(e.response?.data?.detail || 'Generation failed')
    },
  })

  const toggleProgram = (id) => {
    if (config.program_ids === null) {
      setConfig({ ...config, program_ids: [id] })
    } else {
      const next = config.program_ids.includes(id)
        ? config.program_ids.filter(x => x !== id)
        : [...config.program_ids, id]
      setConfig({ ...config, program_ids: next.length === 0 ? null : next })
    }
  }

  const handleGenerate = () => {
    generateMut.mutate(config)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <Zap size={24} className="text-sua-600" /> Timetable Generator
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure and run the automated scheduling engine</p>
      </div>

      {/* System settings summary */}
      {settings && (
        <div className="card p-4 mb-6 bg-sua-50 border-sua-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-sua-600" />
            <span className="text-sm font-medium text-sua-800">Active Scheduling Constraints</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border border-sua-200">
              <p className="text-xs text-gray-500">Working Window</p>
              <p className="font-semibold text-gray-900">{settings.lecturer_available_start_time} – {settings.lecturer_available_end_time}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-sua-200">
              <p className="text-xs text-gray-500">Friday Prayer Block</p>
              <p className="font-semibold text-gray-900">{settings.friday_prayer_start} – {settings.friday_prayer_end}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-sua-200">
              <p className="text-xs text-gray-500">Slot Duration</p>
              <p className="font-semibold text-gray-900">{settings.slot_duration_minutes} minutes</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-sua-200">
              <p className="text-xs text-gray-500">Active Slots</p>
              <p className="font-semibold text-gray-900">{slots.length} defined</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Generate Slots */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
              slots.length > 0 ? 'bg-sua-600 text-white' : 'bg-gray-200 text-gray-600'
            )}>1</div>
            <div>
              <p className="font-medium text-gray-900">Generate Time Slots</p>
              <p className="text-sm text-gray-500">Create weekly time slots based on current settings</p>
            </div>
          </div>
          {slots.length > 0 && (
            <span className="badge-green">{slots.length} slots ready</span>
          )}
        </div>
        <button
          className="btn-secondary"
          onClick={() => slotsMut.mutate()}
          disabled={slotsMut.isPending}
        >
          {slotsMut.isPending ? <><Spinner size="sm" /> Generating…</> : <><RefreshCw size={15} /> {slots.length > 0 ? 'Regenerate Slots' : 'Generate Slots'}</>}
        </button>
        {slotsResult && <p className="text-sm text-sua-700 mt-2">✓ {slotsResult.message}</p>}
        {slots.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">⚠ No slots found — generate them before running the scheduler.</p>
        )}
      </div>

      {/* Step 2: Configure generation */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">2</div>
          <div>
            <p className="font-medium text-gray-900">Configure Generation</p>
            <p className="text-sm text-gray-500">Set the scope and options for this run</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Academic Year">
            <select className="input" value={config.academic_year} onChange={e => setConfig({ ...config, academic_year: e.target.value })}>
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </Field>
          <Field label="Semester">
            <select className="input" value={config.semester} onChange={e => setConfig({ ...config, semester: Number(e.target.value) })}>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </Field>
        </div>

        <Field label={`Programs (${config.program_ids === null ? 'All' : `${config.program_ids.length} selected`})`}>
          <div className="flex gap-2 mb-2">
            <button
              className="text-xs text-sua-600 underline"
              onClick={() => setConfig({ ...config, program_ids: null })}
            >Select All</button>
            <button
              className="text-xs text-gray-500 underline"
              onClick={() => setConfig({ ...config, program_ids: [] })}
            >Deselect All</button>
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {programs.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={config.program_ids === null || config.program_ids.includes(p.id)}
                  onChange={() => toggleProgram(p.id)}
                />
                <span className="font-mono text-xs text-gray-500 w-16">{p.code}</span>
                <span>{p.name}</span>
                <span className="text-gray-400 text-xs ml-auto">({p.current_enrollment} students)</span>
              </label>
            ))}
          </div>
        </Field>

        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={config.clear_existing}
            onChange={e => setConfig({ ...config, clear_existing: e.target.checked })}
          />
          <span className="text-gray-700">Clear existing auto-generated entries before regenerating</span>
          {config.clear_existing && <span className="badge-red">⚠ Will delete existing auto entries</span>}
        </label>
      </div>

      {/* Step 3: Run */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
            result?.success ? 'bg-sua-600 text-white' : 'bg-gray-200 text-gray-600'
          )}>3</div>
          <div>
            <p className="font-medium text-gray-900">Run Scheduler</p>
            <p className="text-sm text-gray-500">Execute the constraint-based scheduling engine</p>
          </div>
        </div>

        <button
          className="btn-primary px-8 py-3 text-base"
          onClick={handleGenerate}
          disabled={generateMut.isPending || slots.length === 0}
        >
          {generateMut.isPending
            ? <><Spinner size="sm" /> Scheduling…</>
            : <><Zap size={18} /> Generate Timetable</>
          }
        </button>
        {slots.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">Complete Step 1 first</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Alert type={result.unscheduled.length === 0 ? 'success' : 'warning'}
            title={`Generation complete — ${result.scheduled_count} sessions scheduled`}>
            {result.unscheduled.length > 0 && (
              <p className="mt-1">{result.unscheduled.length} course-program combinations could not be fully scheduled.</p>
            )}
          </Alert>

          {result.warnings.length > 0 && (
            <div className="card p-4">
              <p className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> Warnings ({result.warnings.length})
              </p>
              <ul className="space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-800">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.unscheduled.length > 0 && (
            <div className="card p-4">
              <p className="font-medium text-red-900 mb-2">Unscheduled Sessions</p>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Program ID</th>
                      <th>Session Type</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.unscheduled.map((u, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs">{u.course_code}</td>
                        <td>{u.program_id}</td>
                        <td><span className={u.session_type === 'LECTURE' ? 'badge-blue' : 'badge-amber'}>{u.session_type}</span></td>
                        <td className="text-red-700 text-xs">{u.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
