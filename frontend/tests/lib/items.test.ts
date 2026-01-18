import { describe, it, expect, vi } from 'vitest'
import { ItemType, ItemCategory } from '@/lib/items'

describe('Items API', () => {
  describe('ItemType enum', () => {
    it('should have RENT value', () => {
      expect(ItemType.RENT).toBe('rent')
    })

    it('should have SALE value', () => {
      expect(ItemType.SALE).toBe('sale')
    })
  })

  describe('ItemCategory enum', () => {
    it('should have all required categories', () => {
      const categories = Object.values(ItemCategory)
      expect(categories).toContain('electronics')
      expect(categories).toContain('clothing')
      expect(categories).toContain('furniture')
      expect(categories).toContain('books')
      expect(categories).toContain('sports')
      expect(categories).toContain('kitchen')
      expect(categories).toContain('tools')
      expect(categories).toContain('games')
      expect(categories).toContain('cosmetics')
      expect(categories).toContain('other')
    })
  })
})

