import { api } from './api'
import { Item } from './items'

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const moderationApi = {
  getPendingItems: async (): Promise<Item[]> => {
    const response = await api.get('/moderation/pending')
    return response.data
  },

  approveItem: async (itemId: number): Promise<Item> => {
    const response = await api.post(`/moderation/${itemId}/approve`)
    return response.data
  },

  rejectItem: async (itemId: number, comment?: string): Promise<Item> => {
    const params = comment ? { comment } : {}
    const response = await api.post(`/moderation/${itemId}/reject`, null, { params })
    return response.data
  },

  getStats: async (): Promise<{ pending: number; approved: number; rejected: number }> => {
    const response = await api.get('/moderation/stats')
    return response.data
  },

  getDetailedStats: async (): Promise<ModerationDetailedStats> => {
    const response = await api.get('/moderation/stats/detailed')
    return response.data
  },
}

export interface ModerationDetailedStats {
  items: {
    total: number
    pending: number
    approved: number
    rejected: number
    periods: {
      approved: {
        today: number
        week: number
        month: number
      }
      rejected: {
        today: number
        week: number
        month: number
      }
    }
  }
  reports: {
    total: number
    pending: number
    resolved: number
    dismissed: number
    periods: {
      resolved: {
        today: number
        week: number
        month: number
      }
      dismissed: {
        today: number
        week: number
        month: number
      }
    }
  }
  moderator: {
    items: {
      approved: number
      rejected: number
      today: number
      week: number
    }
    reports: {
      resolved: number
      dismissed: number
      today: number
      week: number
    }
  }
  admin?: {
    users: {
      total: number
      active: number
    }
    bookings: {
      total: number
      confirmed: number
    }
    items: {
      active: number
    }
  }
}





