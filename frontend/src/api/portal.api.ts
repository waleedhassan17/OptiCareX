import api from './axiosInstance'
import type { Patient, Case, PaginatedResponse } from '../types'

export const portalApi = {
  getProfile: async () => {
    const { data } = await api.get<Patient>('/portal/profile/')
    return data
  },

  updateProfile: async (payload: Partial<Patient>) => {
    const { data } = await api.patch<Patient>('/portal/profile/', payload)
    return data
  },

  listCases: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Case>>('/portal/cases/', { params })
    return data
  },

  getCase: async (id: string) => {
    const { data } = await api.get<Case>(`/portal/cases/${id}/`)
    return data
  },
}
