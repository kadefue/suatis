// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const res = await api.login({ username, password })
        const token = res.data.access_token
        localStorage.setItem('tgs_token', token)
        const meRes = await api.me()
        set({ token, user: meRes.data, isAuthenticated: true })
        return meRes.data
      },

      logout: () => {
        localStorage.removeItem('tgs_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      isAdmin: () => {
        const user = get().user
        return user?.is_superuser || user?.role?.name?.toLowerCase() === 'admin'
      },
    }),
    { name: 'tgs-auth', partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)
