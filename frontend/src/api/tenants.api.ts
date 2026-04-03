import api from './axiosInstance'
import type { Organization, Site, Device, PaginatedResponse } from '../types'

export const tenantsApi = {
  listOrgs: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Organization>>('/tenants/organizations/', { params })
    return data
  },

  getOrg: async (id: string) => {
    const { data } = await api.get<Organization>(`/tenants/organizations/${id}/`)
    return data
  },

  createOrg: async (payload: Partial<Organization>) => {
    const { data } = await api.post<Organization>('/tenants/organizations/', payload)
    return data
  },

  updateOrg: async (id: string, payload: Partial<Organization>) => {
    const { data } = await api.patch<Organization>(`/tenants/organizations/${id}/`, payload)
    return data
  },

  listSites: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Site>>('/tenants/sites/', { params })
    return data
  },

  listDevices: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Device>>('/tenants/devices/', { params })
    return data
  },
}
