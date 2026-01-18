import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '@/lib/auth'

describe('Auth API', () => {
  describe('UserRole enum', () => {
    it('should have correct role values', () => {
      expect(UserRole.USER).toBe('user')
      expect(UserRole.MODERATOR).toBe('moderator')
      expect(UserRole.ADMIN).toBe('admin')
    })
  })

  describe('API functions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should export authApi object', async () => {
      const { authApi } = await import('@/lib/auth')
      expect(authApi).toBeDefined()
      expect(authApi.login).toBeDefined()
      expect(authApi.register).toBeDefined()
      expect(authApi.getMe).toBeDefined()
    })
  })
})

