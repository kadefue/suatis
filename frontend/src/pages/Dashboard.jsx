// src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { StatCard, LoadingPage } from '../components/ui'
import {
  University, Users, BookOpen, DoorOpen, GraduationCap,
  Calendar, AlertTriangle, TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: colleges } = useQuery({ queryKey: ['colleges'], queryFn: () => api.colleges.list().then(r => r.data) })
  const { data: instructors } = useQuery({ queryKey: ['instructors'], queryFn: () => api.instructors.list().then(r => r.data) })
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: () => api.courses.list().then(r => r.data) })
  const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: () => api.rooms.list().then(r => r.data) })
  const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: () => api.programs.list().then(r => r.data) })
  const { data: unscheduled } = useQuery({ queryKey: ['unscheduled'], queryFn: () => api.reports.unscheduledCourses().then(r => r.data) })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings.get().then(r => r.data) })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          {greeting}, {user?.full_name?.split(' ')[0] || user?.username} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {settings?.current_academic_year} · Semester {settings?.current_semester} ·{' '}
          Lecturer hours: {settings?.lecturer_available_start_time}–{settings?.lecturer_available_end_time}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Colleges" value={colleges?.length ?? '—'} icon={University} color="green" />
        <StatCard label="Programs" value={programs?.length ?? '—'} icon={GraduationCap} color="blue" />
        <StatCard label="Instructors" value={instructors?.length ?? '—'} icon={Users} color="purple" />
        <StatCard label="Courses" value={courses?.length ?? '—'} icon={BookOpen} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Rooms & Labs" value={rooms?.length ?? '—'} icon={DoorOpen} color="green" />
        <StatCard
          label="Unscheduled"
          value={unscheduled?.length ?? '—'}
          icon={AlertTriangle}
          color={unscheduled?.length > 0 ? 'red' : 'green'}
          sub="courses needing attention"
        />
        <StatCard
          label="Main Campus Rooms"
          value={rooms?.filter(r => r.campus === 'MAIN').length ?? '—'}
          icon={DoorOpen}
          color="blue"
        />
        <StatCard
          label="Mazimbu Rooms"
          value={rooms?.filter(r => r.campus === 'MAZIMBU').length ?? '—'}
          icon={DoorOpen}
          color="purple"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QuickAction
          to="/generate"
          icon={Calendar}
          title="Generate Timetable"
          description="Run the scheduling engine to auto-assign courses to rooms and time slots."
          color="green"
        />
        <QuickAction
          to="/timetable"
          icon={TrendingUp}
          title="View Timetable"
          description="Browse the generated timetable by program, instructor, or room."
          color="blue"
        />
        <QuickAction
          to="/reports"
          icon={AlertTriangle}
          title="Reports & Analytics"
          description="Review room utilization, workload, and unscheduled courses."
          color="amber"
        />
      </div>

      {/* Unscheduled courses warning */}
      {unscheduled?.length > 0 && (
        <div className="mt-6 card p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <p className="font-medium text-amber-900">{unscheduled.length} courses have unscheduled sessions</p>
          </div>
          <div className="space-y-1.5">
            {unscheduled.slice(0, 5).map(u => (
              <div key={u.course_id + '-' + u.program_id} className="text-sm text-amber-800">
                <span className="font-mono font-medium">{u.course_code}</span>{' '}
                <span className="text-amber-600">({u.program_name})</span>{' '}
                — {u.missing_lecture_slots > 0 ? `${u.missing_lecture_slots} lecture` : ''}{' '}
                {u.missing_practical_slots > 0 ? `${u.missing_practical_slots} practical` : ''} slot(s) missing
              </div>
            ))}
            {unscheduled.length > 5 && (
              <Link to="/reports" className="text-sm text-amber-700 font-medium underline">
                +{unscheduled.length - 5} more → view all in Reports
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function QuickAction({ to, icon: Icon, title, description, color }) {
  const colors = {
    green: 'from-sua-50 to-sua-100 border-sua-200 hover:border-sua-400',
    blue:  'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400',
    amber: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400',
  }
  const iconColors = { green: 'text-sua-600', blue: 'text-blue-600', amber: 'text-amber-600' }
  return (
    <Link
      to={to}
      className={`card p-5 bg-gradient-to-br transition-all duration-150 ${colors[color]}`}
    >
      <Icon size={22} className={`mb-3 ${iconColors[color]}`} />
      <p className="font-display font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}
