import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/auth.api'
import axiosInstance from '../api/axiosInstance'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  setUser: (user: User | null) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
    set({
      user: data.user,
      accessToken: data.access,
      isAuthenticated: true,
    })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // Clear state even if API call fails
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      delete axiosInstance.defaults.headers.common['Authorization']
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })
  },

  refreshToken: async () => {
    const data = await authApi.refreshToken()
    localStorage.setItem('access_token', data.access)
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh)
    }
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
    set({ accessToken: data.access })
  },

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
    set({ user, isAuthenticated: !!user })
  },

  initialize: async () => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (!storedToken || !storedUser) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    set({ accessToken: storedToken, user: JSON.parse(storedUser), isAuthenticated: true })

    try {
      const user = await authApi.getMe()
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, isLoading: false })
    } catch {
      // Token expired or invalid — try refresh
      try {
        await get().refreshToken()
        const user = await authApi.getMe()
        localStorage.setItem('user', JSON.stringify(user))
        set({ user, isAuthenticated: true, isLoading: false })
      } catch {
        // Refresh also failed — clear everything
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        delete axiosInstance.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
      }
    }
  },
}))
