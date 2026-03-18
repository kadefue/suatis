// src/pages/TimetablePage.jsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { LoadingPage, Empty, Alert } from '../components/ui'
import { Calendar, Printer, Filter, LayoutGrid } from 'lucide-react'
import clsx from 'clsx'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_LABELS = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' }

const SESSION_COLORS = {
  LECTURE: 'bg-sua-100 border-sua-300 text-sua-900',
  PRACTICAL: 'bg-amber-50 border-amber-300 text-amber-900',
}

export default function TimetablePage() {
  const [viewMode, setViewMode] = useState('program') // program | instructor | room
  const [selectedId, setSelectedId] = useState('')
  const [academicYear, setAcademicYear] = useState('2024/2025')
  const [semester, setSemester] = useState(1)

  // Load reference lists
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => api.programs.list().then(r => r.data) })
  const { data: instructors = [] } = useQuery({ queryKey: ['instructors'], queryFn: () => api.instructors.list().then(r => r.data) })
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => api.rooms.list().then(r => r.data) })
  const { data: slots = [] } = useQuery({ queryKey: ['slots'], queryFn: () => api.timetable.slots.list().then(r => r.data) })

  // Load timetable entries based on selected view
  const queryParams = { academic_year: academicYear, semester, limit: 1000 }
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timetable', viewMode, selectedId, academicYear, semester],
    queryFn: async () => {
      if (!selectedId) {
        const res = await api.timetable.list(queryParams)
        return res.data
      }
      const id = Number(selectedId)
      let res
      if (viewMode === 'program') res = await api.timetable.byProgram(id, queryParams)
      else if (viewMode === 'instructor') res = await api.timetable.byInstructor(id, queryParams)
      else res = await api.timetable.byRoom(id, queryParams)
      return res.data
    },
    enabled: true,
  })

  // Build lookup: { day: { slotId: [entries] } }
  const grid = useMemo(() => {
    const map = {}
    for (const entry of entries) {
      const day = entry.slot?.day
      const slotId = entry.slot_id
      if (!day || !slotId) continue
      if (!map[day]) map[day] = {}
      if (!map[day][slotId]) map[day][slotId] = []
      map[day][slotId].push(entry)
    }
    return map
  }, [entries])

  // Get unique time labels (rows)
  const timeSlots = useMemo(() => {
    const seen = new Map()
    for (const s of slots) {
      if (!seen.has(s.start_time)) seen.set(s.start_time, s)
    }
    return [...seen.values()].sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [slots])

  const entityList = viewMode === 'program' ? programs : viewMode === 'instructor' ? instructors : rooms
  const entityLabel = (e) => viewMode === 'instructor' ? `${e.first_name} ${e.last_name}` : e.name || e.code

  const handlePrint = () => window.print()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="text-sm text-gray-500 mt-0.5">View schedules by program, instructor, or room</p>
        </div>
        <button className="btn-secondary" onClick={handlePrint}><Printer size={16} /> Print</button>
      </div>

      {/* Controls */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* View mode tabs */}
          <div>
            <label className="label">View By</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { value: 'program', label: 'Program' },
                { value: 'instructor', label: 'Instructor' },
                { value: 'room', label: 'Room' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setViewMode(opt.value); setSelectedId('') }}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    viewMode === opt.value
                      ? 'bg-sua-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entity selector */}
          <div className="flex-1 min-w-48">
            <label className="label">
              {viewMode === 'program' ? 'Program' : viewMode === 'instructor' ? 'Instructor' : 'Room'}
            </label>
            <select
              className="input"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">All</option>
              {entityList.map(e => (
                <option key={e.id} value={e.id}>{entityLabel(e)}</option>
              ))}
            </select>
          </div>

          {/* Academic year & semester */}
          <div>
            <label className="label">Academic Year</label>
            <select className="input w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input w-28" value={semester} onChange={e => setSemester(Number(e.target.value))}>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="flex gap-4 mb-4 flex-wrap">
          <span className="badge-green">{entries.length} total sessions</span>
          <span className="badge-blue">{entries.filter(e => e.session_type === 'LECTURE').length} lectures</span>
          <span className="badge-amber">{entries.filter(e => e.session_type === 'PRACTICAL').length} practicals</span>
          {entries.filter(e => e.is_manual).length > 0 && (
            <span className="badge-purple">{entries.filter(e => e.is_manual).length} manually adjusted</span>
          )}
        </div>
      )}

      {/* Timetable grid */}
      {isLoading ? (
        <LoadingPage />
      ) : slots.length === 0 ? (
        <Alert type="warning" title="No time slots configured">
          Generate slots first via Settings → then run the timetable generator.
        </Alert>
      ) : entries.length === 0 ? (
        <Empty
          icon={Calendar}
          title="No timetable entries"
          description="Run the scheduler to generate a timetable, or adjust your filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm print:shadow-none">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="timetable-header w-20 text-left px-3">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="timetable-header">{DAY_LABELS[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(ts => {
                // Find slot IDs for this time across all days
                const slotsByDay = {}
                for (const day of DAYS) {
                  const daySlots = slots.filter(s => s.day === day && s.start_time === ts.start_time)
                  slotsByDay[day] = daySlots
                }

                return (
                  <tr key={ts.start_time}>
                    <td className="timetable-cell px-2 py-1 text-xs text-gray-500 bg-gray-50 font-medium whitespace-nowrap">
                      {ts.start_time}
                      <br />
                      <span className="text-gray-400">{ts.end_time}</span>
                    </td>
                    {DAYS.map(day => {
                      const daySlots = slotsByDay[day] || []
                      const dayEntries = daySlots.flatMap(s => (grid[day]?.[s.id] || []))

                      return (
                        <td key={day} className="timetable-cell align-top p-1">
                          <div className="space-y-1">
                            {dayEntries.map(entry => (
                              <TimetableCell key={entry.id} entry={entry} viewMode={viewMode} />
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-3 rounded bg-sua-200 border border-sua-300 inline-block" />
          Lecture
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
          Practical
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-3 rounded bg-purple-100 border border-purple-300 inline-block" />
          Manual Override
        </div>
      </div>
    </div>
  )
}

function TimetableCell({ entry, viewMode }) {
  const baseColor = entry.is_manual
    ? 'bg-purple-50 border-purple-300 text-purple-900'
    : SESSION_COLORS[entry.session_type] || 'bg-gray-100 border-gray-300 text-gray-800'

  return (
    <div
      className={clsx('session-card border text-xs rounded p-1.5', baseColor)}
      title={`${entry.course?.name} | ${entry.instructor ? `${entry.instructor.first_name} ${entry.instructor.last_name}` : 'No instructor'} | ${entry.room?.name || 'No room'}`}
    >
      <div className="font-semibold truncate">{entry.course?.code || '?'}</div>
      {viewMode !== 'instructor' && entry.instructor && (
        <div className="opacity-75 truncate">{entry.instructor.last_name}</div>
      )}
      {viewMode !== 'room' && entry.room && (
        <div className="opacity-75 truncate">{entry.room.code || entry.room.name}</div>
      )}
      {viewMode !== 'program' && entry.program && (
        <div className="opacity-75 truncate">{entry.program.code}</div>
      )}
      <div className="mt-0.5">
        <span className="opacity-60">{entry.session_type === 'PRACTICAL' ? '🔬' : '📖'}</span>
      </div>
    </div>
  )
}
