'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { authApi, User } from '@/lib/auth'
import api from '@/lib/api'

export default function ProfilePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.getMe(),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p>Пользователь не найден</p>
        </div>
      </div>
    )
  }

  return <ProfileForm user={user} />
}

function ProfileForm({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: user.email,
      username: user.username,
      full_name: user.full_name || '',
      room_number: user.room_number || '',
      telegram_username: user.telegram_username || '',
    },
  })

  const onSubmit = async (data: any) => {
    try {
      await api.put('/users/me', data)
      setSuccess('Профиль обновлен')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Редактировать
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Обязательное поле' })}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  {...register('username', { required: 'Обязательное поле' })}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ФИО
                </label>
                <input
                  type="text"
                  {...register('full_name')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер комнаты
                </label>
                <input
                  type="text"
                  {...register('room_number')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram username
                </label>
                <input
                  type="text"
                  {...register('telegram_username')}
                  disabled={!isEditing}
                  className="input-field disabled:bg-gray-100"
                  placeholder="@username"
                />
              </div>

              {isEditing && (
                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Отмена
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





