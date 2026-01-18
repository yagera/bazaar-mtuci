'use client'

import { motion } from 'framer-motion'
import { Clock, ShoppingBag } from 'lucide-react'
import { ItemType } from '@/lib/items'

interface ItemTypeToggleProps {
  value: ItemType
  onChange: (value: ItemType) => void
  error?: string
}

export default function ItemTypeToggle({ value, onChange, error }: ItemTypeToggleProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Тип объявления *
      </label>
      <div className="relative inline-flex rounded-xl bg-gray-200 dark:bg-gray-700 p-1.5 shadow-inner">
        {/* Анимированный фон для выбранного элемента */}
        <motion.div
          layoutId="activeType"
          className="absolute top-1.5 bottom-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 shadow-lg"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            left: value === ItemType.RENT ? '0.375rem' : '50%',
            right: value === ItemType.RENT ? '50%' : '0.375rem',
          }}
        />
        
        <motion.button
          type="button"
          onClick={() => onChange(ItemType.RENT)}
          className="relative z-10 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-colors min-w-[120px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Clock className={`h-5 w-5 transition-colors ${
            value === ItemType.RENT 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400'
          }`} />
          <span className={`transition-colors ${
            value === ItemType.RENT 
              ? 'text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            Аренда
          </span>
        </motion.button>
        
        <motion.button
          type="button"
          onClick={() => onChange(ItemType.SALE)}
          className="relative z-10 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-colors min-w-[120px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShoppingBag className={`h-5 w-5 transition-colors ${
            value === ItemType.SALE 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400'
          }`} />
          <span className={`transition-colors ${
            value === ItemType.SALE 
              ? 'text-white' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            Продажа
          </span>
        </motion.button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

