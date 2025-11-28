'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, User as UserIcon, LogOut, Menu, X, Sun, Moon, Globe, Shield } from 'lucide-react'
import { authApi, User, UserRole } from '@/lib/auth'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/lib/i18n'

export default function Navbar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/')
  }

  if (isLoading) {
    return null
  }

  return (
    <nav className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <ShoppingBag className="h-8 w-8 text-primary-950" />
            </motion.div>
            <span className="text-2xl font-bold gradient-text dark:text-primary-400">{t('site.name')}</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
              aria-label="Toggle language"
            >
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {t('nav.catalog')}
            </Link>
            {user ? (
              <>
                <Link href="/my-items" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {t('nav.myItems')}
                </Link>
                <Link href="/bookings" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {t('nav.bookings')}
                </Link>
                {user.role === UserRole.ADMIN && (
                  <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Админ</span>
                  </Link>
                )}
                {(user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
                  <Link href="/moderation" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Модерация</span>
                  </Link>
                )}
                <Link href="/create-item" className="btn-primary">
                  {t('nav.createItem')}
                </Link>
                <div className="flex items-center space-x-3">
                  <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600">
                    <UserIcon className="h-5 w-5" />
                    <span>{user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-3"
          >
            <button
              onClick={toggleTheme}
              className="block w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-2"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 inline mr-2" /> : <Moon className="h-5 w-5 inline mr-2" />}
              {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
            </button>
            <button
              onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
              className="block w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-2"
            >
              <Globe className="h-5 w-5 inline mr-2" />
              {language === 'ru' ? 'English' : 'Русский'}
            </button>
            <Link href="/" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              {t('nav.catalog')}
            </Link>
            {user ? (
              <>
                <Link href="/my-items" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  {t('nav.myItems')}
                </Link>
                <Link href="/bookings" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  {t('nav.bookings')}
                </Link>
                {user.role === UserRole.ADMIN && (
                  <Link href="/admin" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Админ
                  </Link>
                )}
                {(user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
                  <Link href="/moderation" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Модерация
                  </Link>
                )}
                <Link href="/create-item" className="block btn-primary text-center">
                  {t('nav.createItem')}
                </Link>
                <Link href="/profile" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="block btn-primary text-center">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  )
}

