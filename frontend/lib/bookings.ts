import api from './api'

export interface Booking {
  id: number
  item_id: number
  renter_id?: number
  start_time: string
  end_time: string
  total_price?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at?: string
  updated_at?: string | null
  item?: {
    id: number
    title: string
    price_per_hour: string
    owner: {
      id: number
      username: string
      telegram_username: string | null
    }
  }
  renter?: {
    id: number
    username: string
  }
}

export interface BookingCreate {
  item_id: number
  start_time: string
  end_time: string
}

export interface BookingUpdate {
  status?: string
}

export const bookingsApi = {
  create: async (data: BookingCreate): Promise<Booking> => {
    const response = await api.post('/bookings', data)
    return response.data
  },

  getAll: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings')
    return response.data
  },

  getForMyItems: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/my-items')
    return response.data
  },

  getById: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  update: async (id: number, data: BookingUpdate): Promise<Booking> => {
    const response = await api.put(`/bookings/${id}`, data)
    return response.data
  },

  getForItem: async (itemId: number): Promise<Booking[]> => {
    const response = await api.get(`/bookings/item/${itemId}`)
    return response.data
  },
}



