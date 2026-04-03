import api from './axiosInstance'
import type { AuditLog, PaginatedResponse } from '../types'

export const auditApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit/', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<AuditLog>(`/audit/${id}/`)
    return data
  },
}
