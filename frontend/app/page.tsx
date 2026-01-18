'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Clock, MapPin, Image as ImageIcon, Eye, ChevronDown } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CategoryFilter from '@/components/CategoryFilter'
import FavoriteButton from '@/components/FavoriteButton'
import { itemsApi, Item, ItemCategory, ItemType } from '@/lib/items'
import { getCategoryInfo } from '@/lib/categories'
import { useLanguage } from '@/lib/i18n'

export default function Home() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dormitory, setDormitory] = useState<number | undefined>(undefined)
  
  // Инициализируем категорию из URL при первой загрузке
  const urlCategory = searchParams.get('category')
  const isValidCategory = urlCategory && Object.values(ItemCategory).includes(urlCategory as ItemCategory)
  const [category, setCategory] = useState<ItemCategory | undefined>(
    isValidCategory ? (urlCategory as ItemCategory) : undefined
  )
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined)

  // Обновляем URL при изменении категории
  const handleCategoryChange = (newCategory: ItemCategory | undefined) => {
    setCategory(newCategory)
    const params = new URLSearchParams(searchParams.toString())
    if (newCategory) {
      params.set('category', newCategory)
    } else {
      params.delete('category')
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', debouncedSearch, dormitory, category, minPrice, maxPrice],
    queryFn: () => itemsApi.getAll(debouncedSearch || undefined, dormitory, category, minPrice, maxPrice),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <motion.h1 
            className="text-5xl font-bold mb-4 gradient-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {t('home.title')}
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t('home.subtitle')}
          </motion.p>
          
          <div className="space-y-4">
            <motion.div 
              className="relative max-w-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-950 dark:text-primary-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('home.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12 w-full text-lg"
              />
            </motion.div>
            
            <div className="space-y-6">
              {/* Фильтр категорий - визуальный выбор */}
              <CategoryFilter
                selectedCategory={category}
                onCategoryChange={handleCategoryChange}
              />

              {/* Остальные фильтры */}
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('home.dormitory')}
                  </label>
                  <div className="relative select-wrapper">
                    <select
                      key={`dormitory-${language}`}
                      value={dormitory || ''}
                      onChange={(e) => {
                        setDormitory(e.target.value ? parseInt(e.target.value) : undefined)
                        // Убираем фокус после выбора, чтобы стрелка вернулась в исходное положение
                        e.target.blur()
                      }}
                      className="input-field pr-10"
                      defaultValue=""
                    >
                      <option value="">{t('home.dormitoryAll')}</option>
                      <option value="1">{t('home.dormitory1')}</option>
                      <option value="2">{t('home.dormitory2')}</option>
                      <option value="3">{t('home.dormitory3')}</option>
                    </select>
                    <ChevronDown className="select-arrow absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400 pointer-events-none transition-transform duration-200" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('home.priceFrom')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={minPrice || ''}
                    onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="input-field w-32"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('home.priceTo')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="input-field w-32"
                    placeholder="∞"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('home.noItems')}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <ItemCard key={item.id} item={item} index={index} onCategoryClick={handleCategoryChange} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ItemCard({ item, index, onCategoryClick }: { item: Item; index: number; onCategoryClick?: (category: ItemCategory) => void }) {
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/items/${item.id}`}>
        <div className="card cursor-pointer group overflow-hidden">
          <div className="relative rounded-xl mb-4 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[224px]">
            {item.image_url ? (
              <motion.img
                src={item.image_url}
                alt={item.title}
                className="w-full h-auto max-h-[400px] object-contain"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                loading="lazy"
              />
            ) : (
              <div className="w-full min-h-[224px] flex items-center justify-center text-primary-400">
                <ImageIcon className="h-16 w-16" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0 group-hover:text-primary-950 dark:group-hover:text-primary-400 transition-colors">
              {item.title}
            </h3>
            {item.dormitory && (
              <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full whitespace-nowrap">
                {t('item.dormitory')} №{item.dormitory}
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
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
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 text-primary-950 dark:text-primary-400" />
                <span>Комната {item.owner.room_number || 'не указана'}</span>
              </div>
              {item.item_type === ItemType.RENT && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 text-primary-950 dark:text-primary-400" />
                  <span>{item.availabilities.length} расписаний</span>
                </div>
              )}
            </div>
            
            {/* Статистика */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{item.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <FavoriteButton itemId={item.id} ownerId={item.owner_id} size="sm" variant="minimal" showCount />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

