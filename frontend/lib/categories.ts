import { ItemCategory } from './items'
import { 
  Laptop, 
  Shirt, 
  Sofa, 
  BookOpen, 
  Dumbbell, 
  ChefHat, 
  Wrench, 
  Gamepad2, 
  Sparkles, 
  Package 
} from 'lucide-react'

export interface CategoryInfo {
  value: ItemCategory
  label: string
  icon: any
  color: string
  bgColor: string
}

export const categories: CategoryInfo[] = [
  {
    value: ItemCategory.ELECTRONICS,
    label: 'Электроника',
    icon: Laptop,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  },
  {
    value: ItemCategory.CLOTHING,
    label: 'Одежда и обувь',
    icon: Shirt,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
  },
  {
    value: ItemCategory.FURNITURE,
    label: 'Мебель',
    icon: Sofa,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
  {
    value: ItemCategory.BOOKS,
    label: 'Книги и учебники',
    icon: BookOpen,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  },
  {
    value: ItemCategory.SPORTS,
    label: 'Спорт и отдых',
    icon: Dumbbell,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  },
  {
    value: ItemCategory.KITCHEN,
    label: 'Кухонные принадлежности',
    icon: ChefHat,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  },
  {
    value: ItemCategory.TOOLS,
    label: 'Инструменты',
    icon: Wrench,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
  },
  {
    value: ItemCategory.GAMES,
    label: 'Игры и развлечения',
    icon: Gamepad2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  },
  {
    value: ItemCategory.COSMETICS,
    label: 'Косметика и гигиена',
    icon: Sparkles,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  },
  {
    value: ItemCategory.OTHER,
    label: 'Другое',
    icon: Package,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
  },
]

export const getCategoryInfo = (category: ItemCategory): CategoryInfo => {
  return categories.find(c => c.value === category) || categories[categories.length - 1]
}

// Функция для получения переведенного названия категории
export const getCategoryLabel = (category: ItemCategory, t: (key: string) => string): string => {
  // ItemCategory уже содержит значения в нижнем регистре (например, 'electronics')
  const categoryKey = `category.${category}`
  return t(categoryKey) || category
}


