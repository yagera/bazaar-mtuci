import api from './api'
import { Item } from './items'

export interface ItemStats {
  view_count: number
  favorites_count: number
  is_favorite: boolean
}

export const favoritesApi = {
  add: async (itemId: number): Promise<void> => {
    await api.post(`/items/${itemId}/favorite`)
  },

  remove: async (itemId: number): Promise<void> => {
    await api.delete(`/items/${itemId}/favorite`)
  },

  getAll: async (): Promise<Item[]> => {
    const response = await api.get('/favorites')
    return response.data
  },

  getStatus: async (itemId: number): Promise<boolean> => {
    const response = await api.get(`/items/${itemId}/favorite/status`)
    return response.data.is_favorite
  },

  getStats: async (itemId: number): Promise<ItemStats> => {
    const response = await api.get(`/items/${itemId}/stats`)
    return response.data
  },

  incrementView: async (itemId: number): Promise<number> => {
    const response = await api.post(`/items/${itemId}/view`)
    return response.data.view_count
  },
}

