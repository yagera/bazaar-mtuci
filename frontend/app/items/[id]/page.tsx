'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, User, MessageCircle, X, Flag, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import FavoriteButton from '@/components/FavoriteButton'
import { itemsApi, Item, ItemType } from '@/lib/items'
import { getCategoryInfo } from '@/lib/categories'
import { bookingsApi, Booking } from '@/lib/bookings'
import { authApi } from '@/lib/auth'
import { reportsApi, ReportReason } from '@/lib/reports'
import { favoritesApi } from '@/lib/favorites'
import TimeInput from '@/components/TimeInput'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = parseInt(params.id as string)
  const [selectedStartDate, setSelectedStartDate] = useState<string>('')
  const [selectedEndDate, setSelectedEndDate] = useState<string>('')
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00')
  const [selectedEndTime, setSelectedEndTime] = useState<string>('18:00')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>(ReportReason.OTHER)
  const [reportDescription, setReportDescription] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  const { data: item, isLoading, error: itemError } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.getById(itemId),
    enabled: !!itemId && !isNaN(itemId),
    refetchInterval: 30000, // Обновление каждые 30 секунд
    retry: 2,
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', itemId],
    queryFn: () => bookingsApi.getForItem(itemId),
    enabled: !!itemId,
    refetchInterval: 30000, // Обновление каждые 30 секунд
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then(setCurrentUser)
        .catch(() => setCurrentUser(null))
    }
  }, [])

  const queryClient = useQueryClient()
  const bookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      setShowBookingForm(false)
      setSelectedStartDate('')
      setSelectedEndDate('')
      setSelectedStartTime('09:00')
      setSelectedEndTime('18:00')
      alert('Бронирование создано! Владелец получит уведомление.')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Ошибка при создании бронирования')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: () => itemsApi.update(itemId, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      alert('Объявление снято с публикации')
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => itemsApi.update(itemId, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      const message = item?.moderation_status === 'rejected' 
        ? 'Объявление восстановлено и отправлено на модерацию' 
        : 'Объявление восстановлено'
      alert(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      alert('Объявление удалено')
      router.push('/my-items')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Ошибка при удалении объявления')
    },
  })

  const reportMutation = useMutation({
    mutationFn: () => reportsApi.create({
      item_id: itemId,
      reason: reportReason,
      description: reportDescription || undefined,
    }),
    onSuccess: () => {
      setShowReportForm(false)
      setReportDescription('')
      alert('Жалоба отправлена. Модераторы рассмотрят её в ближайшее время.')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Ошибка при отправке жалобы')
    },
  })

  const handleBooking = () => {
    if (!selectedStartDate || !selectedEndDate || !selectedStartTime || !selectedEndTime || !item) return

    const startDateTime = new Date(`${selectedStartDate}T${selectedStartTime}`)
    const endDateTime = new Date(`${selectedEndDate}T${selectedEndTime}`)

    if (endDateTime <= startDateTime) {
      alert('Дата и время окончания должны быть позже даты и времени начала')
      return
    }

    const selectedStart = startDateTime.getTime()
    const selectedEnd = endDateTime.getTime()
    
    // Проверяем пересечения только с активными бронированиями (pending и confirmed)
    const hasOverlap = bookings.some(booking => {
      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return false
      }
      const bookingStart = new Date(booking.start_time).getTime()
      const bookingEnd = new Date(booking.end_time).getTime()
      return selectedStart < bookingEnd && selectedEnd > bookingStart
    })

    if (hasOverlap) {
      alert('Выбранное время пересекается с уже забронированным временем. Пожалуйста, выберите другое время.')
      return
    }

    bookingMutation.mutate({
      item_id: item.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    })
  }

  const handleDeactivate = () => {
    if (confirm('Вы уверены, что хотите снять объявление с публикации?')) {
      deactivateMutation.mutate()
    }
  }

  const handleActivate = () => {
    const message = item?.moderation_status === 'rejected'
      ? 'Объявление будет восстановлено и отправлено на повторную модерацию. Продолжить?'
      : 'Вы уверены, что хотите восстановить объявление?'
    if (confirm(message)) {
      activateMutation.mutate()
    }
  }

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить объявление? Это действие нельзя отменить.')) {
      deleteMutation.mutate()
    }
  }

  const getToday = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = getToday()

  const isOwner = currentUser && item && currentUser.id === item.owner_id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse text-gray-900 dark:text-gray-100">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (itemError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Ошибка при загрузке объявления
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {itemError instanceof Error ? itemError.message : 'Неизвестная ошибка'}
            </p>
            <button
              onClick={() => router.back()}
              className="btn-primary"
            >
              Вернуться назад
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-gray-900 dark:text-gray-100 mb-4">Объявление не найдено</p>
            <button
              onClick={() => router.back()}
              className="btn-primary"
            >
              Вернуться назад
            </button>
          </div>
        </div>
      </div>
    )
  }

  const calculatePrice = () => {
    if (!selectedStartDate || !selectedEndDate || !selectedStartTime || !selectedEndTime) return 0
    
    const startDateTime = new Date(`${selectedStartDate}T${selectedStartTime}`)
    const endDateTime = new Date(`${selectedEndDate}T${selectedEndTime}`)
    
    const hours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
    const pricePerHour = parseFloat(item.price_per_hour)
    if (item.price_per_day && hours >= 24) {
      const days = hours / 24
      return parseFloat(item.price_per_day) * days
    }
    return pricePerHour * hours
  }

  const getBookedSlotsForDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return []
    // Показываем только активные бронирования (pending и confirmed)
    return bookings.filter(booking => {
      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return false
      }
      const bookingStart = new Date(booking.start_time).toISOString().split('T')[0]
      const bookingEnd = new Date(booking.end_time).toISOString().split('T')[0]
      return bookingStart <= endDate && bookingEnd >= startDate
    })
  }

  const bookedSlots = (selectedStartDate && selectedEndDate) ? getBookedSlotsForDateRange(selectedStartDate, selectedEndDate) : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div>
            <div className="card mb-6">
              <div className="relative w-full rounded-lg overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[300px]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-auto max-h-[600px] object-contain"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full min-h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                    Нет фото
                  </div>
                )}
              </div>
              
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(() => {
                  const categoryInfo = getCategoryInfo(item.category)
                  const CategoryIcon = categoryInfo.icon
                  return (
                    <Link
                      href={`/?category=${item.category}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 hover:scale-105 hover:shadow-md ${categoryInfo.bgColor} ${categoryInfo.color.replace('text-', 'border-')} ${categoryInfo.color} cursor-pointer group`}
                      title={`Показать все объявления категории: ${categoryInfo.label}`}
                    >
                      <CategoryIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                      {categoryInfo.label}
                    </Link>
                  )
                })()}
                {item.dormitory && (
                  <span className="inline-block px-3 py-1.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                    Общежитие №{item.dormitory}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold gradient-text dark:text-primary-400 flex-1">{item.title}</h1>
                <div className="ml-4" onClick={(e) => e.stopPropagation()}>
                  <FavoriteButton itemId={itemId} ownerId={item?.owner_id} size="lg" showCount />
                </div>
              </div>
              
              {/* Статистика */}
              <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Eye className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium">{item.view_count || 0} просмотров</span>
                </div>
              </div>
              
              {item.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{item.description}</p>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <User className="h-5 w-5" />
                  <span>{item.owner.full_name || item.owner.username}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="h-5 w-5" />
                  <span>Комната {item.owner.room_number || 'не указана'}</span>
                </div>
                {item.owner.dormitory && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Общежитие №{item.owner.dormitory}</span>
                  </div>
                )}
                {item.owner.telegram_username && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <MessageCircle className="h-5 w-5" />
                    <a
                      href={`https://t.me/${item.owner.telegram_username.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {item.owner.telegram_username}
                    </a>
                  </div>
                )}
              </div>

              {isOwner && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  {item.is_active ? (
                    <button
                      onClick={handleDeactivate}
                      disabled={deactivateMutation.isPending}
                      className="btn-secondary w-full"
                    >
                      {deactivateMutation.isPending ? 'Снятие...' : 'Снять объявление'}
                    </button>
                  ) : (
                    <button
                      onClick={handleActivate}
                      disabled={activateMutation.isPending}
                      className="btn-primary w-full"
                    >
                      {activateMutation.isPending ? 'Восстановление...' : 'Восстановить объявление'}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="btn-secondary w-full bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    {deleteMutation.isPending ? 'Удаление...' : 'Удалить объявление'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Цена</h2>
                <div className="text-5xl font-bold gradient-text mb-2">
                  {item.item_type === ItemType.SALE 
                    ? `${item.sale_price ? parseFloat(item.sale_price).toFixed(0) : '0'} ₽`
                    : `${item.price_per_hour ? parseFloat(item.price_per_hour).toFixed(0) : '0'} ₽/час`}
                </div>
                {item.price_per_day && (
                  <div className="text-lg text-gray-600 dark:text-gray-400">
                    {parseFloat(item.price_per_day).toFixed(0)} ₽/день
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Доступное время
                </h3>
                <div className="space-y-2">
                  {item.availabilities.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">Расписание не указано</p>
                  ) : (
                    item.availabilities.map((avail, idx) => {
                      const startDateStr = avail.start_date ? format(new Date(avail.start_date), 'dd.MM.yyyy', { locale: ru }) : 'Дата не указана'
                      const endDateStr = avail.end_date ? format(new Date(avail.end_date), 'dd.MM.yyyy', { locale: ru }) : 'Дата не указана'
                      const isSameDay = startDateStr === endDateStr
                      const dateRangeStr = isSameDay ? startDateStr : `${startDateStr} - ${endDateStr}`
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{dateRangeStr}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {format(new Date(`2000-01-01T${avail.start_time}`), 'HH:mm', { locale: ru })} - {format(new Date(`2000-01-01T${avail.end_time}`), 'HH:mm', { locale: ru })}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Занятые слоты
                </h3>
                {bookings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bookings.map((booking) => {
                      const startDate = new Date(booking.start_time)
                      const endDate = new Date(booking.end_time)
                      const dateStr = format(startDate, 'dd.MM.yyyy', { locale: ru })
                      const startTimeStr = format(startDate, 'HH:mm', { locale: ru })
                      const endTimeStr = format(endDate, 'HH:mm', { locale: ru })
                      return (
                        <div key={booking.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{dateStr}</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {startTimeStr} - {endTimeStr}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Нет забронированных слотов</p>
                )}
              </div>

              {!isOwner && item.is_active && (
                <>
                  <div className="flex gap-2 mb-4">
                    {item.item_type === ItemType.RENT && (
                      <button
                        onClick={() => setShowBookingForm(!showBookingForm)}
                        className="btn-primary flex-1"
                      >
                        <Calendar className="h-5 w-5 inline mr-2" />
                        Забронировать
                      </button>
                    )}
                    {item.item_type === ItemType.SALE && (
                      <button
                        onClick={() => {
                          const message = `Привет! Интересует товар "${item.title}". Можно обсудить детали?`
                          const telegram = item.owner.telegram_username 
                            ? `https://t.me/${item.owner.telegram_username.replace('@', '')}?text=${encodeURIComponent(message)}`
                            : null
                          if (telegram) {
                            window.open(telegram, '_blank')
                          } else {
                            alert('Telegram не указан. Свяжитесь с владельцем другим способом.')
                          }
                        }}
                        className="btn-primary flex-1"
                      >
                        <MessageCircle className="h-5 w-5 inline mr-2" />
                        Связаться с продавцом
                      </button>
                    )}
                    <button
                      onClick={() => setShowReportForm(!showReportForm)}
                      className="btn-secondary flex items-center justify-center space-x-2"
                      title="Пожаловаться на объявление"
                    >
                      <Flag className="h-5 w-5" />
                      <span>Пожаловаться</span>
                    </button>
                  </div>

                  {showBookingForm && item.item_type === ItemType.RENT && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t pt-6 mt-6"
                    >
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Выберите время</h3>
                      
                      <div className="space-y-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Дата начала *
                            </label>
                            <input
                              type="date"
                              value={selectedStartDate}
                              onChange={(e) => {
                                setSelectedStartDate(e.target.value)
                                if (!selectedEndDate || e.target.value > selectedEndDate) {
                                  setSelectedEndDate(e.target.value)
                                }
                              }}
                              min={today}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Дата окончания *
                            </label>
                            <input
                              type="date"
                              value={selectedEndDate}
                              onChange={(e) => setSelectedEndDate(e.target.value)}
                              min={selectedStartDate || today}
                              className="input-field"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <TimeInput
                            value={selectedStartTime}
                            onChange={setSelectedStartTime}
                            label="Начало"
                          />
                          <TimeInput
                            value={selectedEndTime}
                            onChange={setSelectedEndTime}
                            label="Конец"
                          />
                        </div>

                        {selectedStartDate && selectedEndDate && bookedSlots.length > 0 && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                              Занятые слоты на выбранный период:
                            </p>
                            <div className="space-y-1">
                              {bookedSlots.map((booking) => {
                                const startDate = new Date(booking.start_time)
                                const endDate = new Date(booking.end_time)
                                const startDateStr = format(startDate, 'dd.MM.yyyy', { locale: ru })
                                const endDateStr = format(endDate, 'dd.MM.yyyy', { locale: ru })
                                const startTimeStr = format(startDate, 'HH:mm', { locale: ru })
                                const endTimeStr = format(endDate, 'HH:mm', { locale: ru })
                                const isSameDay = startDateStr === endDateStr
                                return (
                                  <div key={booking.id} className="text-xs text-yellow-700 dark:text-yellow-300">
                                    {isSameDay ? (
                                      `${startDateStr} ${startTimeStr} - ${endTimeStr}`
                                    ) : (
                                      `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedStartDate && selectedEndDate && selectedStartTime && selectedEndTime && (
                        <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Стоимость бронирования:</div>
                          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {calculatePrice().toFixed(2)} ₽
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleBooking}
                        disabled={!selectedStartDate || !selectedEndDate || !selectedStartTime || !selectedEndTime || bookingMutation.isPending}
                        className="btn-primary w-full"
                      >
                        {bookingMutation.isPending ? 'Создание...' : 'Подтвердить бронирование'}
                      </button>
                    </motion.div>
                  )}

                  {showReportForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t pt-6 mt-6"
                    >
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Пожаловаться на объявление</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Причина жалобы *
                          </label>
                          <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value as ReportReason)}
                            className="input-field"
                          >
                            <option value={ReportReason.INAPPROPRIATE_CONTENT}>Неуместный контент</option>
                            <option value={ReportReason.SPAM}>Спам</option>
                            <option value={ReportReason.FAKE}>Поддельное объявление</option>
                            <option value={ReportReason.SCAM}>Мошенничество</option>
                            <option value={ReportReason.OTHER}>Другое</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Описание (необязательно)
                          </label>
                          <textarea
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            rows={3}
                            className="input-field"
                            placeholder="Опишите проблему..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowReportForm(false)
                              setReportDescription('')
                            }}
                            className="btn-secondary flex-1"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => reportMutation.mutate()}
                            disabled={reportMutation.isPending}
                            className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                          >
                            {reportMutation.isPending ? 'Отправка...' : 'Отправить жалобу'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              <div className="space-y-3">
                {isOwner && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Это ваше объявление. Вы не можете его забронировать.
                    </p>
                  </div>
                )}

                {item.moderation_status === 'pending' && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Объявление находится на модерации и будет опубликовано после проверки.
                    </p>
                  </div>
                )}
              </div>

              {item.moderation_status === 'rejected' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mt-3">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                    Объявление отклонено модератором
                  </p>
                  {item.moderation_comment && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {item.moderation_comment}
                    </p>
                  )}
                </div>
              )}

              {!item.is_active && item.moderation_status !== 'rejected' && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Это объявление снято с публикации.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
