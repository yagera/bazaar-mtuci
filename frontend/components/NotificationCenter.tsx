'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notificationsApi, Notification } from '@/lib/notifications'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface NotificationCenterProps {
  userId?: number
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!userId,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.getAll(0, 20, false),
    enabled: !!userId && isOpen,
    refetchInterval: 15000, // Обновление каждые 15 секунд когда открыто
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

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    setIsOpen(false)
  }

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'только что'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} мин. назад`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ч. назад`
    } else {
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru })
    }
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

  if (!userId) return null

  const unreadNotifications = notifications.filter(n => !n.is_read)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Уведомления"
      >
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount.count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4.5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[600px] overflow-hidden flex flex-col"
          >
            {/* Заголовок */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Уведомления</h3>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                >
                  Прочитать все
                </button>
              )}
            </div>

            {/* Список уведомлений */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Нет уведомлений
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => {
                    const link = getNotificationLink(notification)
                      const NotificationContent = (
                        <div
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                            !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                          onClick={() => {
                            handleNotificationClick(notification)
                          }}
                        >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 text-xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatNotificationDate(notification.created_at)}
                              </span>
                              {link && (
                                <ExternalLink className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )

                    if (link) {
                      return (
                        <Link key={notification.id} href={link}>
                          {NotificationContent}
                        </Link>
                      )
                    }

                    return <div key={notification.id}>{NotificationContent}</div>
                  })}
                </div>
              )}
            </div>

            {/* Футер */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Все уведомления
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

