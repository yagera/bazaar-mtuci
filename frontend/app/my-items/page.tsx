'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Edit, Trash2, Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { itemsApi, Item } from '@/lib/items'

export default function MyItemsPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-items'],
    queryFn: () => itemsApi.getMyItems(),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мои объявления</h1>
          <Link href="/create-item" className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Новое объявление</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12"
          >
            <p className="text-gray-500 mb-4">У вас пока нет объявлений</p>
            <Link href="/create-item" className="btn-primary inline-block">
              Создать первое объявление
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ItemCard({ item, index }: { item: Item; index: number }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.delete(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      alert('Объявление удалено')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Ошибка при удалении объявления')
    },
  })

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Вы уверены, что хотите удалить объявление? Это действие нельзя отменить.')) {
      deleteMutation.mutate()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/items/${item.id}`}>
        <div className="card cursor-pointer group overflow-hidden">
          <div className="relative h-48 bg-white dark:bg-gray-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="max-w-full max-h-full object-contain item-image"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Нет фото
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-950 dark:group-hover:text-primary-400 transition-colors">{item.title}</h3>
          
          {item.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
          )}

          <div className="mb-4">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {parseFloat(item.price_per_hour).toFixed(0)} ₽/час
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-1">
              <span className={`text-sm px-2 py-1 rounded ${
                item.is_active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {item.is_active ? 'Активно' : 'Неактивно'}
              </span>
              {item.moderation_status === 'pending' && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  На модерации
                </span>
              )}
              {item.moderation_status === 'rejected' && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  Отклонено
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/items/${item.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Edit className="h-5 w-5" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                title="Удалить объявление"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}


