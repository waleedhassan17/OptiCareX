import api from './axiosInstance'
import type { Task, Referral, FollowUp, PaginatedResponse } from '../types'

export const careApi = {
  listTasks: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Task>>('/care/tasks/', { params })
    return data
  },

  getTask: async (id: string) => {
    const { data } = await api.get<Task>(`/care/tasks/${id}/`)
    return data
  },

  createTask: async (payload: Partial<Task>) => {
    const { data } = await api.post<Task>('/care/tasks/', payload)
    return data
  },

  updateTask: async (id: string, payload: Partial<Task>) => {
    const { data } = await api.patch<Task>(`/care/tasks/${id}/`, payload)
    return data
  },

  listReferrals: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Referral>>('/care/referrals/', { params })
    return data
  },

  createReferral: async (payload: Partial<Referral>) => {
    const { data } = await api.post<Referral>('/care/referrals/', payload)
    return data
  },

  listFollowUps: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<FollowUp>>('/care/follow-ups/', { params })
    return data
  },

  createFollowUp: async (payload: Partial<FollowUp>) => {
    const { data } = await api.post<FollowUp>('/care/follow-ups/', payload)
    return data
  },
}
