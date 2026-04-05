import type { User } from '../types'
import api from './axiosInstance'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface TokenResponse {
  access: string
  refresh: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', payload)
    return data
  },

  refreshToken: async (): Promise<TokenResponse> => {
    const refresh = localStorage.getItem('refresh_token')
    const { data } = await api.post<TokenResponse>('/auth/refresh/', { refresh })
    return data
  },

  logout: async (): Promise<void> => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      await api.post('/auth/logout/', { refresh })
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    }
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me/')
    return data
  },

  updateMe: async (payload: Partial<Pick<User, 'fullName' | 'phone' | 'avatarUrl'>>): Promise<User> => {
    const { data } = await api.patch<User>('/auth/me/', payload)
    return data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.post('/auth/change-password/', { currentPassword, newPassword })
    return data
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password/', { email })
    return data
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await api.post('/auth/reset-password/', { token, newPassword })
    return data
  },

  acceptInvitation: async (token: string, fullName: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/invitations/accept/', {
      token,
      fullName,
      password,
    })
    return data
  },
}
