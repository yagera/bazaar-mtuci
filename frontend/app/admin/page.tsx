'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, FileText, AlertCircle, Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { adminApi } from '@/lib/admin'
import { authApi, User, UserRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then((user) => {
          setCurrentUser(user)
          if (user.role !== UserRole.ADMIN) {
            router.push('/')
          }
        })
        .catch(() => router.push('/'))
    } else {
      router.push('/')
    }
  }, [router])

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter],
    queryFn: () => adminApi.getAllUsers(search || undefined, roleFilter),
    enabled: !!currentUser && currentUser.role === UserRole.ADMIN,
  })

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    enabled: !!currentUser && currentUser.role === UserRole.ADMIN,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      alert('Роль пользователя обновлена')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Ошибка при обновлении роли')
    },
  })

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return null
  }

  const roleLabels: Record<UserRole, string> = {
    [UserRole.USER]: 'Пользователь',
    [UserRole.MODERATOR]: 'Модератор',
    [UserRole.ADMIN]: 'Администратор',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-primary-600 dark:text-primary-400" />
            Панель администратора
          </h1>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Всего пользователей</div>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.users.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Модераторов: {stats.users.moderators} | Админов: {stats.users.admins}
                </div>
              </div>
              <div className="card">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">На модерации</div>
                </div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.items.pending_moderation}
                </div>
              </div>
              <div className="card">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">Жалоб на рассмотрении</div>
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.reports.pending}
                </div>
              </div>
            </div>
          )}

          <div className="card mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Управление пользователями
            </h2>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={roleFilter || ''}
                onChange={(e) => setRoleFilter(e.target.value ? (e.target.value as UserRole) : undefined)}
                className="input-field"
              >
                <option value="">Все роли</option>
                <option value={UserRole.USER}>{roleLabels[UserRole.USER]}</option>
                <option value={UserRole.MODERATOR}>{roleLabels[UserRole.MODERATOR]}</option>
                <option value={UserRole.ADMIN}>{roleLabels[UserRole.ADMIN]}</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Загрузка...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Пользователи не найдены</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Имя пользователя</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Роль</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: User) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{user.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{user.username}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            user.role === UserRole.ADMIN
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                              : user.role === UserRole.MODERATOR
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.id !== currentUser.id && (
                            <select
                              value={user.role}
                              onChange={(e) => {
                                if (confirm(`Изменить роль пользователя ${user.username} на "${roleLabels[e.target.value as UserRole]}"?`)) {
                                  updateRoleMutation.mutate({
                                    userId: user.id,
                                    role: e.target.value as UserRole,
                                  })
                                }
                              }}
                              disabled={updateRoleMutation.isPending}
                              className="text-sm input-field"
                            >
                              <option value={UserRole.USER}>{roleLabels[UserRole.USER]}</option>
                              <option value={UserRole.MODERATOR}>{roleLabels[UserRole.MODERATOR]}</option>
                              <option value={UserRole.ADMIN}>{roleLabels[UserRole.ADMIN]}</option>
                            </select>
                          )}
                          {user.id === currentUser.id && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">Вы</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}


