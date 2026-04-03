import api from './axiosInstance'
import type { Plan } from '../types'

export const billingApi = {
  listPlans: async () => {
    const { data } = await api.get<Plan[]>('/billing/plans/')
    return data
  },

  getCurrentPlan: async () => {
    const { data } = await api.get('/billing/subscription/')
    return data
  },

  subscribe: async (planId: string) => {
    const { data } = await api.post('/billing/subscribe/', { planId })
    return data
  },

  getInvoices: async (params?: Record<string, unknown>) => {
    const { data } = await api.get('/billing/invoices/', { params })
    return data
  },
}
