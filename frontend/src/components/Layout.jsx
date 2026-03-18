// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Building2, Building, GraduationCap, Users,
  DoorOpen, BookOpen, Calendar, Zap, Settings, BarChart3,
  LogOut, ChevronRight, University,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/timetable', label: 'Timetable', icon: Calendar },
  { to: '/generate', label: 'Generate', icon: Zap },
  { label: '─── Academic ───', divider: true },
  { to: '/colleges', label: 'Colleges', icon: University },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/programs', label: 'Programs', icon: GraduationCap },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/instructors', label: 'Instructors', icon: Users },
  { label: '─── Resources ───', divider: true },
  { to: '/rooms', label: 'Rooms & Labs', icon: DoorOpen },
  { label: '─── System ───', divider: true },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-sua-800 flex flex-col flex-shrink-0 overflow-hidden">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sua-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-400 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} className="text-sua-900" />
            </div>
            <div>
              <p className="text-white font-display font-semibold text-sm leading-tight">SUA Timetable</p>
              <p className="text-sua-300 text-xs leading-tight">Generation System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item, i) => {
            if (item.divider) {
              return (
                <div key={i} className="px-2 pt-4 pb-1">
                  <span className="text-sua-400 text-xs font-medium">{item.label}</span>
                </div>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 group',
                    isActive
                      ? 'bg-sua-600 text-white'
                      : 'text-sua-200 hover:bg-sua-700 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="opacity-60" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-sua-700">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-sua-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.full_name?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.full_name || user?.username}</p>
              <p className="text-sua-400 text-xs truncate">{user?.role?.name || 'User'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sua-400 hover:text-red-300 transition-colors p-1"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
