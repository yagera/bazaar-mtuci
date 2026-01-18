'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Clock, Check, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { bookingsApi, Booking } from '@/lib/bookings'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

export default function BookingsPage() {
  const queryClient = useQueryClient()
  
  const { data: myBookings = [], isLoading: isLoadingMy } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getAll(),
    refetchInterval: 15000, // Обновление каждые 15 секунд
  })

  const { data: itemsBookings = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['bookings-my-items'],
    queryFn: () => bookingsApi.getForMyItems(),
    refetchInterval: 15000, // Обновление каждые 15 секунд
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bookingsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-my-items'] })
    },
  })

  const handleStatusUpdate = (id: number, status: string) => {
    updateMutation.mutate({ id, status })
  }

  if (isLoadingMy || isLoadingItems) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Бронирования</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Мои бронирования</h2>
            {myBookings.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">У вас нет активных бронирований</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((booking, index) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    index={index}
                    isOwner={false}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Бронирования моих вещей</h2>
            {itemsBookings.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Нет бронирований ваших вещей</p>
              </div>
            ) : (
              <div className="space-y-4">
                {itemsBookings.map((booking, index) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    index={index}
                    isOwner={true}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function BookingCard({
  booking,
  index,
  isOwner,
  onStatusUpdate,
}: {
  booking: Booking
  index: number
  isOwner: boolean
  onStatusUpdate: (id: number, status: string) => void
}) {
  const startDate = new Date(booking.start_time)
  const endDate = new Date(booking.end_time)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Подтверждено'
      case 'pending':
        return 'Ожидает подтверждения'
      case 'completed':
        return 'Завершено'
      case 'cancelled':
        return 'Отменено'
      default:
        return status
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Link
              href={`/items/${booking.item.id}`}
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {booking.item.title}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isOwner ? `Арендатор: ${booking.renter.username}` : `Владелец: ${booking.item.owner.username}`}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(startDate, 'd MMMM yyyy', { locale: ru })}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {format(startDate, 'HH:mm', { locale: ru })} - {format(endDate, 'HH:mm', { locale: ru })}
            </span>
          </div>
          <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
            {parseFloat(booking.total_price).toFixed(2)} ₽
          </div>
        </div>

        {isOwner && booking.status === 'pending' && (
          <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onStatusUpdate(booking.id, 'confirmed')}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Подтвердить</span>
            </button>
            <button
              onClick={() => onStatusUpdate(booking.id, 'cancelled')}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Отклонить</span>
            </button>
          </div>
        )}

        {!isOwner && (booking.status === 'pending' || booking.status === 'confirmed') && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={() => {
                if (confirm('Вы уверены, что хотите отменить это бронирование?')) {
                  onStatusUpdate(booking.id, 'cancelled')
                }
              }}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Отменить бронирование</span>
            </button>
            {booking.item.owner.telegram_username && (
              <a
                href={`https://t.me/${booking.item.owner.telegram_username.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                Связаться в Telegram →
              </a>
            )}
          </div>
        )}

        {!isOwner && booking.status !== 'pending' && booking.status !== 'confirmed' && booking.item.owner.telegram_username && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href={`https://t.me/${booking.item.owner.telegram_username.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
            >
              Связаться в Telegram →
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
}








