'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesApi, ItemStats } from '@/lib/favorites'
import { authApi } from '@/lib/auth'

interface FavoriteButtonProps {
  itemId: number
  ownerId?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  variant?: 'default' | 'minimal'
}

export default function FavoriteButton({ 
  itemId,
  ownerId,
  size = 'md',
  showCount = false,
  variant = 'default'
}: FavoriteButtonProps) {
  const queryClient = useQueryClient()
  const [isHovered, setIsHovered] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  
  // Получаем текущего пользователя
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then(user => setCurrentUserId(user.id))
        .catch(() => setCurrentUserId(null))
    } else {
      setCurrentUserId(null)
    }
  }, [])
  
  // Получаем статистику товара
  const { data: stats, isLoading } = useQuery<ItemStats>({
    queryKey: ['item-stats', itemId],
    queryFn: () => favoritesApi.getStats(itemId),
    retry: false,
  })

  const isFavorite = stats?.is_favorite || false
  const favoritesCount = stats?.favorites_count || 0
  const isOwner = ownerId !== undefined && currentUserId !== null && ownerId === currentUserId

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await favoritesApi.remove(itemId)
      } else {
        await favoritesApi.add(itemId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-stats', itemId] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
    onError: (error: any) => {
      console.error('Ошибка при изменении избранного:', error)
      alert(error.response?.data?.detail || 'Ошибка при изменении избранного')
    },
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMutation.mutate()
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <div className="animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 h-5 w-5" />
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center transition-all"
        aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        disabled={toggleMutation.isPending}
      >
        <motion.div
            animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Heart
            className={`${iconSizes[size]} transition-colors ${
              isFavorite
                ? 'fill-red-500 text-red-500'
                : 'text-gray-400 hover:text-red-400 dark:hover:text-red-500'
            }`}
          />
        </motion.div>
        {showCount && favoritesCount > 0 && (
          <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
            {favoritesCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full transition-all ${
          isFavorite
            ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
        } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        disabled={toggleMutation.isPending}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isFavorite ? (
            <motion.div
              key="filled"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            >
              <Heart className={`${iconSizes[size]} fill-red-500 text-red-500`} />
            </motion.div>
          ) : (
            <motion.div
              key="outline"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Heart
                className={`${iconSizes[size]} text-gray-600 dark:text-gray-300 ${
                  isHovered ? 'text-red-400 dark:text-red-500' : ''
                } transition-colors`}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Эффект пульсации при добавлении */}
        {isFavorite && isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </motion.button>
      
      {showCount && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[20px]">
          {favoritesCount > 0 ? favoritesCount : ''}
        </span>
      )}
    </div>
  )
}

