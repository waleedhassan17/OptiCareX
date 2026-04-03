import api from './axiosInstance'
import type { Notification, PaginatedResponse } from '../types'

export const notificationsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data } = await api.get<PaginatedResponse<Notification>>('/notifications/', { params })
    return data
  },

  markRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/`, { isRead: true })
    return data
  },

  markAllRead: async () => {
    const { data } = await api.post('/notifications/mark-all-read/')
    return data
  },

  getUnreadCount: async () => {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count/')
    return data
  },
}
