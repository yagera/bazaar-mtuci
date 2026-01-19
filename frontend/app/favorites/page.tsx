'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart, Eye } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import FavoriteButton from '@/components/FavoriteButton'
import { favoritesApi } from '@/lib/favorites'
import { Item, ItemType } from '@/lib/items'

export default function FavoritesPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <Heart className="h-6 w-6 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Избранное
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {items.length} {items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center py-16"
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <Heart className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Избранное пусто
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  Добавляйте товары в избранное, чтобы быстро находить их позже
                </p>
                <Link href="/" className="btn-primary">
                  Перейти в каталог
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => (
                <FavoriteItemCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

function FavoriteItemCard({ item, index }: { item: Item; index: number }) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/items/${item.id}`}>
        <div className="card cursor-pointer group overflow-hidden">
          <div className="relative h-56 rounded-xl mb-4 overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            {item.image_url ? (
              <motion.img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-contain item-image"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-400">
                <div className="h-16 w-16" />
              </div>
            )}
            
            {/* Кнопка избранного */}
            <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton itemId={item.id} ownerId={item.owner_id} size="sm" variant="minimal" />
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0 group-hover:text-primary-950 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
              {item.title}
            </h3>
          </div>
          
          {item.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {item.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div>
              {item.item_type === ItemType.SALE ? (
                <p className="text-3xl font-bold gradient-text">
                  {item.sale_price ? parseFloat(item.sale_price).toFixed(0) : '0'} ₽
                </p>
              ) : (
                <>
                  <p className="text-3xl font-bold gradient-text">
                    {item.price_per_hour ? parseFloat(item.price_per_hour).toFixed(0) : '0'} ₽/час
                  </p>
                  {item.price_per_day && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {parseFloat(item.price_per_day).toFixed(0)} ₽/день
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{item.view_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

