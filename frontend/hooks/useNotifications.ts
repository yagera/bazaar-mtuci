import { useQuery } from '@tanstack/react-query'
import { moderationApi } from '@/lib/moderation'
import { reportsApi } from '@/lib/reports'
import { bookingsApi } from '@/lib/bookings'
import { UserRole } from '@/lib/auth'

interface NotificationCounts {
  moderationItems: number // Объявления на модерации
  pendingReports: number // Жалобы на рассмотрении
  pendingBookings: number // Ожидающие подтверждения бронирования (для владельцев)
  total: number // Общая сумма для админов/модераторов
}

/**
 * Хук для получения счетчиков уведомлений для модераторов и админов
 */
export function useModerationNotifications(userRole?: UserRole) {
  const isModerator = userRole === UserRole.MODERATOR || userRole === UserRole.ADMIN
  const isAdmin = userRole === UserRole.ADMIN

  // Получаем статистику модерации (pending объявления)
  const { data: moderationStats } = useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => moderationApi.getStats(),
    enabled: isModerator,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  })

  // Получаем статистику жалоб (pending жалобы)
  const { data: reportStats } = useQuery({
    queryKey: ['reports', 'stats'],
    queryFn: () => reportsApi.getStats(),
    enabled: isModerator,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  })

  const counts: NotificationCounts = {
    moderationItems: moderationStats?.pending || 0,
    pendingReports: reportStats?.pending || 0,
    pendingBookings: 0, // Будет добавлено позже
    total: (moderationStats?.pending || 0) + (reportStats?.pending || 0),
  }

  return {
    counts,
    isLoading: isModerator && (!moderationStats || !reportStats),
  }
}

/**
 * Хук для получения счетчиков уведомлений о бронированиях
 */
export function useBookingNotifications(userId?: number) {
  const { data: itemsBookings = [] } = useQuery({
    queryKey: ['bookings-my-items'],
    queryFn: () => bookingsApi.getForMyItems(),
    enabled: !!userId,
    refetchInterval: 15000, // Обновление каждые 15 секунд
  })

  // Подсчитываем pending бронирования для владельца
  const pendingCount = itemsBookings.filter((booking: any) => booking.status === 'pending').length

  return {
    pendingBookings: pendingCount,
    isLoading: false,
  }
}

