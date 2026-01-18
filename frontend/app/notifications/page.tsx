'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Bell, Check, X, ExternalLink, CheckCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { notificationsApi, Notification } from '@/lib/notifications'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { authApi } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then(setCurrentUser)
        .catch(() => {
          router.push('/')
        })
    } else {
      router.push('/')
    }
  }, [router])

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'all', filter],
    queryFn: () => notificationsApi.getAll(0, 100, filter === 'unread'),
    enabled: !!currentUser,
    refetchInterval: 15000, // Обновление каждые 15 секунд
  })

  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!currentUser,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  })

  const queryClient = useQueryClient()

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'dd.MM.yyyy HH:mm', { locale: ru })
  }

  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.related_item_id) {
      return `/items/${notification.related_item_id}`
    }
    if (notification.related_booking_id) {
      return '/bookings'
    }
    return null
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'item_approved':
        return '✅'
      case 'item_rejected':
      case 'item_removed_by_report':
        return '❌'
      case 'new_booking_request':
      case 'booking_confirmed':
        return '📅'
      case 'booking_rejected':
      case 'booking_cancelled_by_owner':
      case 'booking_cancelled_by_renter':
        return '🚫'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'item_approved':
      case 'booking_confirmed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'item_rejected':
      case 'item_removed_by_report':
      case 'booking_rejected':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'booking_cancelled_by_owner':
      case 'booking_cancelled_by_renter':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'new_booking_request':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Уведомления
              </h1>
              {unreadCount.count > 0 && (
                <span className="flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-bold text-white bg-red-500 rounded-full">
                  {unreadCount.count > 99 ? '99+' : unreadCount.count}
                </span>
              )}
            </div>
            {unreadCount.count > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Прочитать все</span>
              </button>
            )}
          </div>

          {/* Фильтры */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`pb-4 px-4 font-medium ${
                filter === 'all'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-4 px-4 font-medium flex items-center space-x-2 ${
                filter === 'unread'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span>Непрочитанные</span>
              {unreadCount.count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                  {unreadCount.count > 99 ? '99+' : unreadCount.count}
                </span>
              )}
            </button>
          </div>

          {/* Список уведомлений */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="card text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedNotifications.map((notification, index) => {
                const link = getNotificationLink(notification)
                const NotificationCard = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`card border-l-4 ${
                      !notification.is_read 
                        ? `${getNotificationColor(notification.type)} border-l-blue-500` 
                        : 'border-l-gray-300 dark:border-l-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNotificationDate(notification.created_at)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                disabled={markAsReadMutation.isPending}
                                className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                                title="Отметить как прочитанное"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {link && (
                              <Link
                                href={link}
                                className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                title="Перейти"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(notification.id)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Удалить"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )

                return <div key={notification.id}>{NotificationCard}</div>
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}


