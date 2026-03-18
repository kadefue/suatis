// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import CollegesPage from './pages/CollegesPage'
import DepartmentsPage from './pages/DepartmentsPage'
import ProgramsPage from './pages/ProgramsPage'
import InstructorsPage from './pages/InstructorsPage'
import RoomsPage from './pages/RoomsPage'
import CoursesPage from './pages/CoursesPage'
import TimetablePage from './pages/TimetablePage'
import GenerationPage from './pages/GenerationPage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="colleges" element={<CollegesPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="generate" element={<GenerationPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}
