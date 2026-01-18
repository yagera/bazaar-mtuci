'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Edit, Trash2, Plus, RotateCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { itemsApi, Item } from '@/lib/items'
import { useLanguage } from '@/lib/i18n'

export default function MyItemsPage() {
  const { t } = useLanguage()
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-items'],
    queryFn: () => itemsApi.getMyItems(),
    refetchInterval: 20000, // Обновление каждые 20 секунд
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('myItems.title')}</h1>
          <Link href="/create-item" className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>{t('myItems.newItem')}</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('myItems.loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12"
          >
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('myItems.noItems')}</p>
            <Link href="/create-item" className="btn-primary inline-block">
              {t('myItems.createFirst')}
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
  const { t } = useLanguage()
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.delete(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      alert(t('myItems.deleted'))
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || t('myItems.deleteError'))
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => itemsApi.update(item.id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', item.id] })
      const message = item.moderation_status === 'rejected' 
        ? t('myItems.restoredAndModeration')
        : t('myItems.restored')
      alert(message)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || t('myItems.restoreError'))
    },
  })

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(t('myItems.deleteConfirm'))) {
      deleteMutation.mutate()
    }
  }

  const handleActivate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const message = item.moderation_status === 'rejected'
      ? t('myItems.restoreConfirmRejected')
      : t('myItems.restoreConfirm')
    if (confirm(message)) {
      activateMutation.mutate()
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
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center min-h-[192px]">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-auto max-h-[300px] object-contain"
                loading="lazy"
              />
            ) : (
              <div className="w-full min-h-[192px] flex items-center justify-center text-gray-400">
                {t('myItems.noPhoto')}
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-950 dark:group-hover:text-primary-400 transition-colors">{item.title}</h3>
          
          {item.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>
          )}

          <div className="mb-4">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {item.item_type === 'sale' && item.sale_price
                ? `${parseFloat(item.sale_price).toFixed(0)} ${t('myItems.price')}`
                : item.price_per_hour
                ? `${parseFloat(item.price_per_hour).toFixed(0)} ${t('myItems.pricePerHour')}`
                : item.price_per_day
                ? `${parseFloat(item.price_per_day).toFixed(0)} ${t('myItems.pricePerDay')}`
                : ''}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-1">
              <span className={`text-sm px-2 py-1 rounded ${
                item.is_active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {item.is_active ? t('myItems.active') : t('myItems.inactive')}
              </span>
              {item.moderation_status === 'pending' && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  {t('moderation.pending')}
                </span>
              )}
              {item.moderation_status === 'rejected' && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  {t('moderation.rejected')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/items/${item.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title={t('myItems.editTitle')}
              >
                <Edit className="h-5 w-5" />
              </Link>
              {!item.is_active && (
                <button
                  onClick={handleActivate}
                  disabled={activateMutation.isPending}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                  title={t('myItems.restoreTitle')}
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                title={t('myItems.deleteTitle')}
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


