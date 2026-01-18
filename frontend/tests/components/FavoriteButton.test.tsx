import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/tests/utils/test-utils'
import { QueryClient } from '@tanstack/react-query'
import FavoriteButton from '@/components/FavoriteButton'

// Mock API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('FavoriteButton', () => {
  const mockItem = {
    id: 1,
    title: 'Test Item',
    owner_id: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render favorite button', () => {
    render(<FavoriteButton itemId={mockItem.id} ownerId={mockItem.owner_id} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show favorite count', async () => {
    const { default: api } = await import('@/lib/api')
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { count: 5, is_favorite: false },
    })

    render(<FavoriteButton itemId={mockItem.id} ownerId={mockItem.owner_id} />)

    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })
  })
})

