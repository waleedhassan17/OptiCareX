import api from './axiosInstance'
import type { ClinicalReview, PaginatedResponse } from '../types'

export const clinicalApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<ClinicalReview>>('/clinical/', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<ClinicalReview>(`/clinical/${id}/`)
    return data
  },

  create: async (payload: Partial<ClinicalReview>) => {
    const { data } = await api.post<ClinicalReview>('/clinical/', payload)
    return data
  },

  update: async (id: string, payload: Partial<ClinicalReview>) => {
    const { data } = await api.patch<ClinicalReview>(`/clinical/${id}/`, payload)
    return data
  },
}
