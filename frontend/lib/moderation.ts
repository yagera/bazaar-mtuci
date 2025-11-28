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
}


