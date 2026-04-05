import api from './axiosInstance'
import type { User, Invitation, PaginatedResponse } from '../types'

export interface CreateUserPayload {
  email: string
  fullName: string
  role: string
  site?: string
}

export interface UpdateUserPayload {
  fullName?: string
  phone?: string
  avatarUrl?: string
  role?: string
  site?: string | null
}

export interface CreateInvitationPayload {
  email: string
  role: string
  site?: string
}

export const usersApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<User>>('/users/', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<User>(`/users/${id}/`)
    return data
  },

  create: async (payload: CreateUserPayload) => {
    const { data } = await api.post<User>('/users/', payload)
    return data
  },

  update: async (id: string, payload: UpdateUserPayload) => {
    const { data } = await api.patch<User>(`/users/${id}/`, payload)
    return data
  },

  deactivate: async (id: string) => {
    const { data } = await api.post(`/users/${id}/deactivate/`)
    return data
  },

  reactivate: async (id: string) => {
    const { data } = await api.post(`/users/${id}/reactivate/`)
    return data
  },
}

export const invitationsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Invitation>>('/invitations/', { params })
    return data
  },

  create: async (payload: CreateInvitationPayload) => {
    const { data } = await api.post<Invitation>('/invitations/', payload)
    return data
  },

  resend: async (id: string) => {
    const { data } = await api.post(`/invitations/${id}/resend/`)
    return data
  },

  cancel: async (id: string) => {
    const { data } = await api.delete(`/invitations/${id}/`)
    return data
  },
}
