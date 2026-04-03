import api from './axiosInstance'
import type { InferenceResult, PaginatedResponse } from '../types'

export const inferenceApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<InferenceResult>>('/inference/', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<InferenceResult>(`/inference/${id}/`)
    return data
  },

  trigger: async (caseId: string) => {
    const { data } = await api.post<InferenceResult>(`/inference/run/`, { caseId })
    return data
  },

  getByCase: async (caseId: string) => {
    const { data } = await api.get<InferenceResult[]>(`/inference/`, { params: { caseId } })
    return data
  },
}
