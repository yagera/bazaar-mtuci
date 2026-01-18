import api from './api'

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  room_number: string | null
  dormitory: number | null
  telegram_username: string | null
  is_active: boolean
  role: UserRole
  created_at: string
  updated_at: string | null
}

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  dormitory: number
  room_number?: string
  telegram_username?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  login: async (data: LoginData): Promise<TokenResponse> => {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/users/me/stats')
    return response.data
  },
}

export interface UserStats {
  items: {
    total: number
    active: number
    inactive: number
  }
  views: {
    total: number
  }
  favorites: {
    total: number
  }
  bookings: {
    as_owner: {
      total: number
      confirmed: number
      completed: number
    }
    as_renter: {
      total: number
      confirmed: number
      completed: number
    }
  }
  sales: {
    active_items: number
  }
  earnings: {
    total: number
  }
}


