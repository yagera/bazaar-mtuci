import { api } from './api'
import { User, UserRole } from './auth'

export const adminApi = {
  getAllUsers: async (search?: string, role?: UserRole): Promise<User[]> => {
    const params: any = {}
    if (search) params.search = search
    if (role) params.role = role
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}/role`, { role })
    return response.data
  },

  getStats: async (): Promise<{
    users: { total: number; moderators: number; admins: number }
    items: { total: number; pending_moderation: number }
    reports: { total: number; pending: number }
  }> => {
    const response = await api.get('/admin/stats')
    return response.data
  },
}

