'use client'

import { motion } from 'framer-motion'
import { ItemCategory } from '@/lib/items'
import { categories, getCategoryInfo, getCategoryLabel } from '@/lib/categories'
import { X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface CategoryFilterProps {
  selectedCategory?: ItemCategory
  onCategoryChange: (category: ItemCategory | undefined) => void
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const { t } = useLanguage()
  const selectedCategoryInfo = selectedCategory ? getCategoryInfo(selectedCategory) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('category.title')}
        </label>
        {selectedCategory && (
          <button
            onClick={() => onCategoryChange(undefined)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            {t('category.reset')}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Выбранная категория (если есть) */}
      {selectedCategoryInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-3"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 ${selectedCategoryInfo.bgColor} border-primary-400 dark:border-primary-500 shadow-sm`}>
            <div className={`p-1.5 rounded-lg ${selectedCategoryInfo.bgColor} border ${selectedCategoryInfo.color.replace('text-', 'border-')}`}>
              <selectedCategoryInfo.icon className={`h-4 w-4 ${selectedCategoryInfo.color}`} />
            </div>
            <span className={`text-sm font-semibold ${selectedCategoryInfo.color}`}>
              {getCategoryLabel(selectedCategoryInfo.value, t)}
            </span>
            <button
              onClick={() => onCategoryChange(undefined)}
              className="ml-2 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label={t('category.removeFilter')}
            >
              <X className={`h-4 w-4 ${selectedCategoryInfo.color}`} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Список категорий для выбора */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.value
          
          return (
            <motion.button
              key={category.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(isSelected ? undefined : category.value)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `${category.bgColor} border-primary-500 dark:border-primary-400 shadow-md`
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm'
              }`}
              aria-pressed={isSelected}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                isSelected 
                  ? category.bgColor 
                  : 'bg-gray-50 dark:bg-gray-700'
              } border ${
                isSelected 
                  ? category.color.replace('text-', 'border-') 
                  : 'border-gray-200 dark:border-gray-600 group-hover:border-primary-300 dark:group-hover:border-primary-600'
              }`}>
                <Icon className={`h-4 w-4 transition-colors ${
                  isSelected 
                    ? category.color 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                }`} />
              </div>
              <span className={`text-sm font-medium transition-colors ${
                isSelected
                  ? category.color
                  : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
              }`}>
                {getCategoryLabel(category.value, t)}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 dark:bg-primary-400 rounded-full flex items-center justify-center shadow-lg"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}


