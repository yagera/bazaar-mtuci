'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { authApi } from '@/lib/auth'
import { useLanguage } from '@/lib/i18n'

interface RegisterForm {
  email: string
  username: string
  password: string
  confirmPassword: string
  dormitory: number
  room_number?: string
  telegram_username?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    mode: 'onChange'
  })

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const email = watch('email')
  const username = watch('username')

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z\d]/.test(pwd)) strength++
    
    if (strength <= 2) return { strength, label: t('register.passwordWeak'), color: 'bg-red-500' }
    if (strength <= 3) return { strength, label: t('register.passwordMedium'), color: 'bg-yellow-500' }
    return { strength, label: t('register.passwordStrong'), color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password || '')

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const { confirmPassword, ...registerData } = data
      if (registerData.room_number && !registerData.room_number.trim()) {
        delete registerData.room_number
      }
      if (registerData.telegram_username && !registerData.telegram_username.trim()) {
        delete registerData.telegram_username
      }
      if (registerData.dormitory === undefined || registerData.dormitory === null || registerData.dormitory === '') {
        setError(t('register.selectDormitory'))
        setIsLoading(false)
        return
      }
      
      await authApi.register(registerData)
      router.push('/login?registered=true')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка регистрации'
      if (typeof errorMessage === 'string') {
        setError(errorMessage)
      } else if (Array.isArray(errorMessage)) {
        setError(errorMessage.map((e: any) => e.msg || e.message).join(', '))
      } else {
        setError('Произошла ошибка при регистрации. Попробуйте еще раз.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="card dark:bg-gray-800">
            <motion.h1 
              className="text-4xl font-bold mb-6 text-center gradient-text dark:text-primary-400"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('nav.register')}
            </motion.h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Обязательное поле',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Некорректный email адрес'
                      }
                    })}
                    className={`input-field ${errors.email ? 'border-red-500' : email && !errors.email ? 'border-green-500' : ''}`}
                    placeholder="example@mail.ru"
                  />
                  {email && !errors.email && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                  {errors.email && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя пользователя *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('username', { 
                      required: 'Обязательное поле',
                      minLength: {
                        value: 3,
                        message: 'Минимум 3 символа'
                      },
                      maxLength: {
                        value: 20,
                        message: 'Максимум 20 символов'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Только буквы, цифры и подчеркивание'
                      }
                    })}
                    className={`input-field ${errors.username ? 'border-red-500' : username && !errors.username ? 'border-green-500' : ''}`}
                    placeholder="username"
                  />
                  {username && !errors.username && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                  {errors.username && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  )}
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('home.dormitory')} *
                </label>
                <select
                  {...register('dormitory', { required: language === 'ru' ? 'Выберите общежитие' : 'Select dormitory', valueAsNumber: true })}
                  className="input-field"
                  defaultValue=""
                >
                  <option value="" disabled hidden>{language === 'ru' ? 'Выберите общежитие' : 'Select dormitory'}</option>
                  <option value="1">{t('home.dormitory1')}</option>
                  <option value="2">{t('home.dormitory2')}</option>
                  <option value="3">{t('home.dormitory3')}</option>
                </select>
                {errors.dormitory && (
                  <p className="mt-1 text-sm text-red-600">{errors.dormitory.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('register.roomNumber')}
                </label>
                <input
                  type="text"
                  {...register('room_number')}
                  className="input-field"
                  placeholder={t('register.roomNumberPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('register.telegramUsername')}
                </label>
                <input
                  type="text"
                  {...register('telegram_username')}
                  className="input-field"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('register.password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: t('profile.requiredField'), 
                      minLength: { value: 6, message: t('register.passwordMinLength') },
                      validate: (value) => {
                        if (value.length < 6) return t('register.passwordMinLength')
                        return true
                      }
                    })}
                    className={`input-field pr-10 ${errors.password ? 'border-red-500' : password && !errors.password ? 'border-green-500' : ''}`}
                    placeholder={t('register.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Надежность пароля:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <div className={`flex items-center ${password && password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                        {password && password.length >= 6 ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {t('register.passwordMinLength')}
                      </div>
                      <div className={`flex items-center ${password && password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                        {password && password.length >= 8 ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {t('register.passwordRecommended') || 'Рекомендуется 8+ символов'}
                      </div>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('register.confirmPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: t('profile.requiredField'),
                      validate: (value) => {
                        if (!value) return t('profile.requiredField')
                        if (value !== password) return t('register.passwordMismatch')
                        return true
                      }
                    })}
                    className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : confirmPassword && confirmPassword === password && !errors.confirmPassword ? 'border-green-500' : ''}`}
                    placeholder={t('register.confirmPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
                    <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
                {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('register.passwordsMatch')}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? t('register.registering') : t('register.submit')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('register.haveAccount')}{' '}
              <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium">
                {t('register.login')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

