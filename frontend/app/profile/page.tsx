'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Package, Eye, Heart, Calendar, ShoppingBag, TrendingUp, CheckCircle, Clock, ChevronDown } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { authApi, User, UserStats } from '@/lib/auth'
import api from '@/lib/api'
import { useLanguage } from '@/lib/i18n'

export default function ProfilePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.getMe(),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-500 dark:text-gray-400">Пользователь не найден</p>
        </div>
      </div>
    )
  }

  return <ProfileForm user={user} />
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: user.email,
      username: user.username,
      full_name: user.full_name || '',
      dormitory: user.dormitory ? user.dormitory.toString() : '',
      room_number: user.room_number || '',
      telegram_username: user.telegram_username || '',
    },
  })

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: () => authApi.getStats(),
  })

  const onSubmit = async (data: any) => {
    try {
      await api.put('/users/me', data)
      setSuccess(t('profile.updated'))
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || t('profile.updateError'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Статистика */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={Package}
                label={t('stats.totalItems')}
                value={stats.items.total}
                subValue={`${stats.items.active} ${t('stats.active')}`}
                gradient="from-blue-500 to-cyan-500"
                delay={0}
              />
              <StatCard
                icon={Eye}
                label={t('stats.views')}
                value={stats.views.total}
                subValue={t('stats.total')}
                gradient="from-purple-500 to-pink-500"
                delay={0.1}
              />
              <StatCard
                icon={Heart}
                label={t('stats.inFavorites')}
                value={stats.favorites.total}
                subValue={t('stats.additions')}
                gradient="from-red-500 to-rose-500"
                delay={0.2}
              />
              <StatCard
                icon={TrendingUp}
                label={t('stats.earnings')}
                value={`${stats.earnings.total.toFixed(0)} ₽`}
                subValue={t('stats.earned')}
                gradient="from-green-500 to-emerald-500"
                delay={0.3}
              />
            </div>
          )}

          {/* Детальная статистика */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <DetailStatCard
                title={t('stats.bookingsAsOwner')}
                stats={stats.bookings.as_owner}
                icon={Calendar}
                gradient="from-indigo-500 to-blue-500"
              />
              <DetailStatCard
                title={t('stats.bookingsAsRenter')}
                stats={stats.bookings.as_renter}
                icon={ShoppingBag}
                gradient="from-orange-500 to-amber-500"
              />
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('profile.title')}</h1>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  {t('profile.edit')}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  {...register('email', { required: t('profile.requiredField') })}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.username')}
                </label>
                <input
                  type="text"
                  {...register('username', { required: t('profile.requiredField') })}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.fullName')}
                </label>
                <input
                  type="text"
                  {...register('full_name')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.dormitory')}
                </label>
                <div className="relative select-wrapper">
                  <select
                    {...{
                      ...register('dormitory', {
                        setValueAs: (value) => value === '' ? undefined : parseInt(value)
                      }),
                      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                        // Вызываем стандартный onChange от react-hook-form
                        const { onChange } = register('dormitory', {
                          setValueAs: (value) => value === '' ? undefined : parseInt(value)
                        })
                        onChange(e)
                        // Убираем фокус после выбора, чтобы стрелка вернулась в исходное положение
                        e.target.blur()
                      }
                    }}
                    disabled={!isEditing}
                    className="input-field pr-10 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                  >
                    <option value="">{t('profile.dormitoryNotSelected')}</option>
                    <option value="1">{t('home.dormitory1')}</option>
                    <option value="2">{t('home.dormitory2')}</option>
                    <option value="3">{t('home.dormitory3')}</option>
                  </select>
                  <ChevronDown className="select-arrow absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400 pointer-events-none transition-transform duration-200" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.roomNumber')}
                </label>
                <input
                  type="text"
                  {...register('room_number')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.telegramUsername')}
                </label>
                <input
                  type="text"
                  {...register('telegram_username')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400"
                  placeholder="@username"
                />
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {t('profile.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    {t('profile.cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  gradient, 
  delay 
}: { 
  icon: any
  label: string
  value: string | number
  subValue?: string
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradient} mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </div>
        {subValue && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {subValue}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DetailStatCard({
  title,
  stats,
  icon: Icon,
  gradient
}: {
  title: string
  stats: { total: number; confirmed: number; completed: number }
  icon: any
  gradient: string
}) {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card"
    >
          <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('stats.all')}</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('stats.confirmed')}</span>
          </div>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.confirmed}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('stats.completed')}</span>
          </div>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.completed}</span>
        </div>
      </div>
    </motion.div>
  )
}








