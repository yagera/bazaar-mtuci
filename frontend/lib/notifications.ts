import api from './api'

export enum NotificationType {
  ITEM_REMOVED_BY_REPORT = 'item_removed_by_report',
  ITEM_APPROVED = 'item_approved',
  ITEM_REJECTED = 'item_rejected',
  NEW_BOOKING_REQUEST = 'new_booking_request',
  BOOKING_CANCELLED_BY_RENTER = 'booking_cancelled_by_renter',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED_BY_OWNER = 'booking_cancelled_by_owner',
}

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  related_item_id?: number
  related_booking_id?: number
  related_report_id?: number
  created_at: string
  read_at?: string
}

export interface NotificationUpdate {
  is_read?: boolean
}

export const notificationsApi = {
  getAll: async (skip = 0, limit = 50, unreadOnly = false): Promise<Notification[]> => {
    const response = await api.get('/notifications/', {
      params: { skip, limit, unread_only: unreadOnly },
    })
    return response.data
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread/count')
    return response.data
  },

  getById: async (id: number): Promise<Notification> => {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}`, { is_read: true })
    return response.data
  },

  markAllAsRead: async (): Promise<{ marked_as_read: number }> => {
    const response = await api.patch('/notifications/read-all')
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`)
  },
}


