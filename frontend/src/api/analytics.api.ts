import api from './axiosInstance'

export const analyticsApi = {
  getAdminSummary: async () => {
    const { data } = await api.get('/analytics/admin-summary/')
    return data
  },
  getTechnicianSummary: async () => {
    const { data } = await api.get('/analytics/technician-summary/')
    return data
  },
  getClinicianSummary: async () => {
    const { data } = await api.get('/analytics/clinician-summary/')
    return data
  },
  getCoordinatorSummary: async () => {
    const { data } = await api.get('/analytics/coordinator-summary/')
    return data
  },
  getPlatformSummary: async () => {
    const { data } = await api.get('/analytics/platform-summary/')
    return data
  },
}
