// src/api/client.js
import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('tgs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tgs_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client

// ── Resource helpers ──────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (data) => client.post('/auth/login', new URLSearchParams(data)),
  register: (data) => client.post('/auth/register', data),
  me: () => client.get('/auth/me'),

  // Colleges
  colleges: {
    list: () => client.get('/colleges'),
    get: (id) => client.get(`/colleges/${id}`),
    create: (data) => client.post('/colleges', data),
    update: (id, data) => client.patch(`/colleges/${id}`, data),
    delete: (id) => client.delete(`/colleges/${id}`),
  },

  // Departments
  departments: {
    list: (params) => client.get('/departments', { params }),
    get: (id) => client.get(`/departments/${id}`),
    create: (data) => client.post('/departments', data),
    update: (id, data) => client.patch(`/departments/${id}`, data),
    delete: (id) => client.delete(`/departments/${id}`),
  },

  // Programs
  programs: {
    list: (params) => client.get('/programs', { params }),
    get: (id) => client.get(`/programs/${id}`),
    create: (data) => client.post('/programs', data),
    update: (id, data) => client.patch(`/programs/${id}`, data),
    delete: (id) => client.delete(`/programs/${id}`),
  },

  // Instructors
  instructors: {
    list: (params) => client.get('/instructors', { params }),
    get: (id) => client.get(`/instructors/${id}`),
    create: (data) => client.post('/instructors', data),
    update: (id, data) => client.patch(`/instructors/${id}`, data),
    delete: (id) => client.delete(`/instructors/${id}`),
    availability: {
      get: (id) => client.get(`/instructors/${id}/availability`),
      set: (id, data) => client.post(`/instructors/${id}/availability`, data),
    },
  },

  // Rooms
  rooms: {
    list: (params) => client.get('/rooms', { params }),
    get: (id) => client.get(`/rooms/${id}`),
    create: (data) => client.post('/rooms', data),
    update: (id, data) => client.patch(`/rooms/${id}`, data),
    delete: (id) => client.delete(`/rooms/${id}`),
  },

  // Courses
  courses: {
    list: () => client.get('/courses'),
    get: (id) => client.get(`/courses/${id}`),
    create: (data) => client.post('/courses', data),
    update: (id, data) => client.patch(`/courses/${id}`, data),
    delete: (id) => client.delete(`/courses/${id}`),
  },

  // Timetable
  timetable: {
    generate: (data) => client.post('/generate-timetable', data),
    list: (params) => client.get('/timetable', { params }),
    byProgram: (id, params) => client.get(`/timetable/program/${id}`, { params }),
    byInstructor: (id, params) => client.get(`/timetable/instructor/${id}`, { params }),
    byRoom: (id, params) => client.get(`/timetable/room/${id}`, { params }),
    update: (id, data) => client.put(`/timetable/${id}`, data),
    delete: (id) => client.delete(`/timetable/${id}`),
    slots: {
      list: () => client.get('/slots'),
      generate: () => client.post('/slots/generate'),
      create: (data) => client.post('/slots', data),
      delete: (id) => client.delete(`/slots/${id}`),
    },
  },

  // Settings
  settings: {
    get: () => client.get('/settings'),
    update: (key, data) => client.put(`/settings/${key}`, data),
  },

  // Reports
  reports: {
    roomUtilization: (params) => client.get('/reports/room-utilization', { params }),
    instructorWorkload: (params) => client.get('/reports/instructor-workload', { params }),
    unscheduledCourses: (params) => client.get('/reports/unscheduled-courses', { params }),
  },
}
