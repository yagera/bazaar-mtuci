'use client'

import { useState, useEffect, createContext, useContext } from 'react'

type Language = 'ru' | 'en'

interface Translations {
  [key: string]: {
    ru: string
    en: string
  }
}

const translations: Translations = {
  'site.name': { ru: 'Базар МТУСИ', en: 'Bazaar MTUCI' },
  'nav.catalog': { ru: 'Каталог', en: 'Catalog' },
  'nav.myItems': { ru: 'Мои объявления', en: 'My Items' },
  'nav.bookings': { ru: 'Бронирования', en: 'Bookings' },
  'nav.createItem': { ru: 'Разместить объявление', en: 'Create Item' },
  'nav.login': { ru: 'Войти', en: 'Login' },
  'nav.register': { ru: 'Регистрация', en: 'Register' },
  'nav.profile': { ru: 'Профиль', en: 'Profile' },
  'nav.logout': { ru: 'Выйти', en: 'Logout' },
  'home.title': { ru: 'Аренда вещей в общежитии МТУСИ', en: 'Rent items in MTUCI dormitory' },
  'home.subtitle': { ru: 'Найди нужную вещь или размести своё объявление', en: 'Find what you need or post your ad' },
  'home.search': { ru: 'Поиск по названию...', en: 'Search by name...' },
  'home.dormitory': { ru: 'Общежитие', en: 'Dormitory' },
  'home.dormitoryAll': { ru: 'Все', en: 'All' },
  'home.dormitory1': { ru: 'Общежитие №1', en: 'Dormitory №1' },
  'home.dormitory2': { ru: 'Общежитие №2', en: 'Dormitory №2' },
  'home.dormitory3': { ru: 'Общежитие №3', en: 'Dormitory №3' },
  'home.priceFrom': { ru: 'Цена от (₽/час)', en: 'Price from (₽/hour)' },
  'home.priceTo': { ru: 'Цена до (₽/час)', en: 'Price to (₽/hour)' },
  'home.noItems': { ru: 'Объявления не найдены', en: 'No items found' },
  'item.dormitory': { ru: 'Общ.', en: 'Dorm.' },
}

const LanguageContext = createContext<{
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
} | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLang = localStorage.getItem('language') as Language | null
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export async function translateText(text: string, targetLang: 'ru' | 'en'): Promise<string> {
  return text
}

