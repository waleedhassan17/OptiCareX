import api from './axiosInstance'
import type { Case, CaseImage, PaginatedResponse } from '../types'

export const casesApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Case>>('/cases/', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<Case>(`/cases/${id}/`)
    return data
  },

  create: async (payload: Partial<Case>) => {
    const { data } = await api.post<Case>('/cases/', payload)
    return data
  },

  update: async (id: string, payload: Partial<Case>) => {
    const { data } = await api.patch<Case>(`/cases/${id}/`, payload)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/cases/${id}/`)
  },

  uploadImage: async (caseId: string, formData: FormData) => {
    const { data } = await api.post<CaseImage>(`/cases/${caseId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getImages: async (caseId: string) => {
    const { data } = await api.get<CaseImage[]>(`/cases/${caseId}/images/`)
    return data
  },
}
