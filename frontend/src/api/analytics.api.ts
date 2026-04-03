import api from './axiosInstance'
import type { UsageMetrics } from '../types'

export const analyticsApi = {
  getUsage: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<UsageMetrics>('/analytics/usage/', { params })
    return data
  },

  getDashboard: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/analytics/dashboard/', { params })
    return data
  },

  getReports: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/analytics/reports/', { params })
    return data
  },
}
