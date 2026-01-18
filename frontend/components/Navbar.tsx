'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, User as UserIcon, LogOut, Menu, X, Sun, Moon, Globe, Shield, ChevronDown, Settings, FileCheck, Users, Heart } from 'lucide-react'
import { authApi, User, UserRole } from '@/lib/auth'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/lib/i18n'
import { useModerationNotifications, useBookingNotifications } from '@/hooks/useNotifications'
import NotificationCenter from '@/components/NotificationCenter'

export default function Navbar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Получаем счетчики уведомлений для модераторов/админов
  const { counts: notificationCounts } = useModerationNotifications(user?.role)
  
  // Получаем счетчики уведомлений о бронированиях
  const { pendingBookings } = useBookingNotifications(user?.id)

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

  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

          <div className="hidden md:flex items-center gap-3">
            {/* Группа: Настройки (тема, язык) */}
            <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle language"
                title="Переключить язык"
              >
                <Globe className="h-5 w-5" />
              </button>
            </div>

            {/* Группа: Навигация (Каталог, Мои объявления, Бронирования) */}
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                {t('nav.catalog')}
              </Link>

              {user && (
                <>
                  <Link href="/my-items" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                    {t('nav.myItems')}
                  </Link>
                  <Link href="/favorites" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    <span>{t('nav.favorites') || 'Избранное'}</span>
                  </Link>
                  <Link href="/bookings" className="relative flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                    <span>{t('nav.bookings')}</span>
                    {pendingBookings > 0 && (
                      <span className="min-w-[18px] h-4.5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                        {pendingBookings > 99 ? '99+' : pendingBookings}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* Группа: Админ функции (если есть) */}
            {user && (user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
              <div className="relative border-r border-gray-200 dark:border-gray-700 pr-3" ref={adminMenuRef}>
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  title={t('nav.administration')}
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('nav.admin')}</span>
                  {notificationCounts.total > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                      {notificationCounts.total > 99 ? '99+' : notificationCounts.total}
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                    <AnimatePresence>
                      {isAdminMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                        >
                          {user.role === UserRole.ADMIN && (
                            <Link
                              href="/admin"
                              onClick={() => setIsAdminMenuOpen(false)}
                              className="relative flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>{t('nav.adminPanel')}</span>
                              </div>
                            </Link>
                          )}
                          {(user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
                            <Link
                              href="/moderation"
                              onClick={() => setIsAdminMenuOpen(false)}
                              className="relative flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <FileCheck className="h-4 w-4" />
                                <span>{t('nav.moderation')}</span>
                              </div>
                              {notificationCounts.total > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                                  {notificationCounts.total > 99 ? '99+' : notificationCounts.total}
                                </span>
                              )}
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
            )}

            {/* Группа: Действия пользователя (Создать, Уведомления, Профиль) */}
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <Link href="/create-item" className="btn-primary text-sm px-3 py-1.5 whitespace-nowrap">
                    {t('nav.createItem')}
                  </Link>
                  <NotificationCenter userId={user.id} />
                </div>

                {/* Выпадающее меню для профиля пользователя */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[90px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform flex-shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>{t('nav.profile')}</span>
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            handleLogout()
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('nav.logout')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="btn-primary text-sm px-3 py-1.5 whitespace-nowrap">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 space-y-2"
            >
              <button
                onClick={toggleTheme}
                className="block w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 inline mr-2" /> : <Moon className="h-5 w-5 inline mr-2" />}
                {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
              </button>
              <button
                onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
                className="block w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Globe className="h-5 w-5 inline mr-2" />
                {language === 'ru' ? 'English' : 'Русский'}
              </button>
              {user && (
                <div className="px-2 py-1">
                  <NotificationCenter userId={user.id} />
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              <Link 
                href="/" 
                onClick={() => setIsMenuOpen(false)}
                className="block p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {t('nav.catalog')}
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/my-items" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {t('nav.myItems')}
                  </Link>
                  <Link 
                    href="/favorites" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>Избранное</span>
                  </Link>
                  <Link 
                    href="/bookings" 
                    onClick={() => setIsMenuOpen(false)}
                    className="relative flex items-center justify-between p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <span>{t('nav.bookings')}</span>
                    {pendingBookings > 0 && (
                      <span className="min-w-[18px] h-4.5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                        {pendingBookings > 99 ? '99+' : pendingBookings}
                      </span>
                    )}
                  </Link>
                  
                  {/* Админ/модератор функции в мобильном меню */}
                  {(user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Администрирование
                      </div>
                      {user.role === UserRole.ADMIN && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          <span>{t('nav.adminPanel')}</span>
                        </Link>
                      )}
                      {(user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
                        <Link 
                          href="/moderation" 
                          onClick={() => setIsMenuOpen(false)}
                          className="relative flex items-center justify-between p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <FileCheck className="h-4 w-4" />
                            <span>{t('nav.moderation')}</span>
                          </div>
                          {notificationCounts.total > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                              {notificationCounts.total > 99 ? '99+' : notificationCounts.total}
                            </span>
                          )}
                        </Link>
                      )}
                    </>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  <Link 
                    href="/create-item" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block btn-primary text-center"
                  >
                    {t('nav.createItem')}
                  </Link>
                  <Link 
                    href="/profile" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('nav.profile')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex items-center space-x-2 w-full text-left p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsMenuOpen(false)}
                    className="block btn-primary text-center"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

