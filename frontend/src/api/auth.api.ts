import api from './axiosInstance'

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>('/auth/login/', payload)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  },

  refreshToken: async (): Promise<TokenResponse> => {
    const refresh = localStorage.getItem('refresh_token')
    const { data } = await api.post<TokenResponse>('/auth/token/refresh/', { refresh })
    localStorage.setItem('access_token', data.access)
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh)
    }
    return data
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password/', { email })
    return data
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await api.post('/auth/reset-password/', { token, password })
    return data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
  },
}
