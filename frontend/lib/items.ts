import api from './api'

export interface Availability {
  id: number
  item_id: number
  day_of_week?: number | null  // Вычисляется автоматически из даты
  date?: string | null  // Дата в формате YYYY-MM-DD (для обратной совместимости)
  start_date: string  // Начало диапазона дат в формате YYYY-MM-DD
  end_date: string  // Конец диапазона дат в формате YYYY-MM-DD
  start_time: string
  end_time: string
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Item {
  id: number
  title: string
  description: string | null
  price_per_hour: string
  price_per_day: string | null
  image_url: string | null
  owner_id: number
  dormitory: number | null
  is_active: boolean
  moderation_status: ModerationStatus
  moderation_comment: string | null
  moderated_by_id: number | null
  moderated_at: string | null
  created_at: string
  updated_at: string | null
  owner: {
    id: number
    username: string
    full_name: string | null
    room_number: string | null
    dormitory: number | null
    telegram_username: string | null
  }
  availabilities: Availability[]
}

export interface ItemCreate {
  title: string
  description?: string
  price_per_hour: number
  price_per_day?: number
  image_url?: string
  availabilities?: {
    date?: string | null  // Дата в формате YYYY-MM-DD (для обратной совместимости)
    start_date: string  // Начало диапазона дат в формате YYYY-MM-DD
    end_date: string  // Конец диапазона дат в формате YYYY-MM-DD
    start_time: string
    end_time: string
  }[]
}

export interface ItemUpdate {
  title?: string
  description?: string
  price_per_hour?: number
  price_per_day?: number
  image_url?: string
  is_active?: boolean
  availabilities?: {
    date?: string | null  // Дата в формате YYYY-MM-DD (для обратной совместимости)
    start_date: string  // Начало диапазона дат в формате YYYY-MM-DD
    end_date: string  // Конец диапазона дат в формате YYYY-MM-DD
    start_time: string
    end_time: string
  }[]
}

export const itemsApi = {
  getAll: async (search?: string, dormitory?: number, minPrice?: number, maxPrice?: number): Promise<Item[]> => {
    const params: any = {}
    if (search) params.search = search
    if (dormitory) params.dormitory = dormitory
    if (minPrice !== undefined) params.min_price = minPrice
    if (maxPrice !== undefined) params.max_price = maxPrice
    const response = await api.get('/items', { params })
    return response.data
  },

  getById: async (id: number): Promise<Item> => {
    const response = await api.get(`/items/${id}`)
    return response.data
  },

  create: async (data: ItemCreate): Promise<Item> => {
    const response = await api.post('/items', data)
    return response.data
  },

  update: async (id: number, data: ItemUpdate): Promise<Item> => {
    const response = await api.put(`/items/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`)
  },

  getMyItems: async (): Promise<Item[]> => {
    const response = await api.get('/items/me/items')
    return response.data
  },
}


