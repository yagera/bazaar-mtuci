'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ItemCategory } from '@/lib/items'
import { categories, getCategoryInfo, CategoryInfo, getCategoryLabel } from '@/lib/categories'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface CategorySelectProps {
  value?: ItemCategory
  onChange: (category: ItemCategory) => void
  error?: string
}

export default function CategorySelect({ value, onChange, error }: CategorySelectProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedCategory = value ? getCategoryInfo(value) : null

  // Фильтруем категории по поисковому запросу
  const filteredCategories = categories.filter(category => {
    const label = getCategoryLabel(category.value, t)
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Закрытие при клике вне компонента и keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      // Фокус на поиск при открытии
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleCategoryClick = (category: ItemCategory) => {
    onChange(category)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('category.title')} *
      </label>
      
      {/* Выбранная категория (кнопка) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('category.select')}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg transition-all duration-200 ${
          error
            ? 'border-red-300 dark:border-red-700 focus-within:border-red-500 dark:focus-within:border-red-500'
            : selectedCategory
            ? 'border-primary-300 dark:border-primary-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        } focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20`}
      >
        {selectedCategory ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg border flex-shrink-0 ${selectedCategory.bgColor} ${selectedCategory.color.replace('text-', 'border-')}`}>
              <selectedCategory.icon className={`h-5 w-5 ${selectedCategory.color}`} />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {getCategoryLabel(selectedCategory.value, t)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('category.select')}
          </span>
        )}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {selectedCategory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(ItemCategory.OTHER)
                setSearchQuery('')
              }}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('category.clear')}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Выпадающий список категорий */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay для закрытия */}
            <div
              className="fixed inset-0 z-10 bg-black/10 backdrop-blur-sm"
              onClick={() => {
                setIsOpen(false)
                setSearchQuery('')
              }}
              aria-hidden="true"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-1/2 top-1/2 z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              role="listbox"
              style={{ 
                width: buttonRef.current?.offsetWidth ? `${buttonRef.current.offsetWidth}px` : 'auto',
                maxWidth: '90vw',
                minWidth: '320px'
              }}
            >
              {/* Поиск */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('category.search')}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 dark:focus:border-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      aria-label={t('category.clear')}
                    >
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Список категорий */}
              <div className="max-h-[400px] overflow-y-auto p-3">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('category.notFound')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredCategories.map((category) => {
                      const Icon = category.icon
                      const isSelected = value === category.value
                      
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleCategoryClick(category.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleCategoryClick(category.value)
                            }
                          }}
                          role="option"
                          aria-selected={isSelected}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-150 text-left ${
                            isSelected
                              ? `${category.bgColor} border-primary-500 dark:border-primary-400 shadow-sm`
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                        >
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            isSelected ? category.bgColor : 'bg-white dark:bg-gray-800'
                          } border ${isSelected ? category.color.replace('text-', 'border-') : 'border-gray-200 dark:border-gray-600'}`}>
                            <Icon className={`h-5 w-5 ${category.color}`} />
                          </div>
                          <span className={`flex-1 text-sm font-medium ${
                            isSelected 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {getCategoryLabel(category.value, t)}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex-shrink-0"
                            >
                              <div className="p-1 rounded-full bg-primary-500 dark:bg-primary-400">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            </motion.div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
