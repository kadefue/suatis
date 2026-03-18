// src/pages/ReportsPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { BarChart3, Building, Users, AlertTriangle } from 'lucide-react'
import { LoadingPage, ProgressBar, Empty } from '../components/ui'
import clsx from 'clsx'

const TABS = [
  { key: 'rooms', label: 'Room Utilization', icon: Building },
  { key: 'workload', label: 'Instructor Workload', icon: Users },
  { key: 'unscheduled', label: 'Unscheduled Courses', icon: AlertTriangle },
]

export default function ReportsPage() {
  const [tab, setTab] = useState('rooms')
  const [params, setParams] = useState({ academic_year: '2024/2025', semester: 1 })

  const { data: roomReport = [], isLoading: rl } = useQuery({
    queryKey: ['report-rooms', params],
    queryFn: () => api.reports.roomUtilization(params).then(r => r.data),
    enabled: tab === 'rooms',
  })
  const { data: workload = [], isLoading: wl } = useQuery({
    queryKey: ['report-workload', params],
    queryFn: () => api.reports.instructorWorkload(params).then(r => r.data),
    enabled: tab === 'workload',
  })
  const { data: unscheduled = [], isLoading: ul } = useQuery({
    queryKey: ['report-unscheduled', params],
    queryFn: () => api.reports.unscheduledCourses(params).then(r => r.data),
    enabled: tab === 'unscheduled',
  })

  const isLoading = (tab === 'rooms' && rl) || (tab === 'workload' && wl) || (tab === 'unscheduled' && ul)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-sua-600" /> Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analytics and scheduling insights</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-36" value={params.academic_year} onChange={e => setParams({ ...params, academic_year: e.target.value })}>
            <option value="2024/2025">2024/2025</option>
            <option value="2025/2026">2025/2026</option>
          </select>
          <select className="input w-32" value={params.semester} onChange={e => setParams({ ...params, semester: Number(e.target.value) })}>
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.key
                ? 'border-sua-600 text-sua-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <t.icon size={15} />
            {t.label}
            {t.key === 'unscheduled' && unscheduled.length > 0 && (
              <span className="badge-red ml-1">{unscheduled.length}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingPage /> : (
        <>
          {/* Room Utilization */}
          {tab === 'rooms' && (
            roomReport.length === 0 ? (
              <Empty icon={Building} title="No room data" description="Generate a timetable first" />
            ) : (
              <div className="space-y-3">
                {roomReport.map(r => (
                  <div key={r.room_id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{r.room_name}</span>
                        <span className={clsx('ml-2 badge', r.campus === 'MAIN' ? 'badge-blue' : 'badge-amber')}>{r.campus}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">{r.utilization_percent}%</span>
                        <span className="text-xs text-gray-500 ml-2">{r.used_slots}/{r.total_slots} slots</span>
                      </div>
                    </div>
                    <ProgressBar value={r.used_slots} max={r.total_slots} />
                  </div>
                ))}
              </div>
            )
          )}

          {/* Instructor Workload */}
          {tab === 'workload' && (
            workload.length === 0 ? (
              <Empty icon={Users} title="No workload data" description="Generate a timetable first" />
            ) : (
              <div className="space-y-3">
                {workload.map(w => (
                  <div key={w.instructor_id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{w.instructor_name}</span>
                        {w.department && <span className="text-sm text-gray-500 ml-2">· {w.department}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">{w.load_percent}%</span>
                        <span className="text-xs text-gray-500 ml-2">{w.scheduled_hours}/{w.max_load_hours} hrs</span>
                      </div>
                    </div>
                    <ProgressBar value={w.scheduled_hours} max={w.max_load_hours} />
                  </div>
                ))}
              </div>
            )
          )}

          {/* Unscheduled Courses */}
          {tab === 'unscheduled' && (
            unscheduled.length === 0 ? (
              <div className="card p-8 text-center border-green-200 bg-green-50">
                <div className="text-green-600 text-4xl mb-3">✓</div>
                <p className="font-medium text-green-900 text-lg">All courses are fully scheduled!</p>
                <p className="text-sm text-green-700 mt-1">No missing sessions found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unscheduled.map((u, i) => (
                  <div key={i} className="card p-4 border-amber-200 bg-amber-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-gray-900">{u.course_code}</span>
                          <span className="text-gray-600">–</span>
                          <span className="text-sm text-gray-700">{u.course_name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Program: {u.program_name}</p>
                        <p className="text-xs text-amber-700 mt-1">{u.reason}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {u.missing_lecture_slots > 0 && (
                          <span className="badge-blue">{u.missing_lecture_slots} lecture slots missing</span>
                        )}
                        {u.missing_practical_slots > 0 && (
                          <span className="badge-amber">{u.missing_practical_slots} practical slots missing</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
