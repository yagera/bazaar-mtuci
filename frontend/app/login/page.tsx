'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { authApi } from '@/lib/auth'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Регистрация успешна! Войдите в систему.')
    }
  }, [searchParams])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await authApi.login(data)
      localStorage.setItem('token', response.access_token)
      router.push('/')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка входа'
      if (typeof errorMessage === 'string') {
        setError(errorMessage)
      } else if (Array.isArray(errorMessage)) {
        setError(errorMessage.map((e: any) => e.msg || e.message).join(', '))
      } else {
        setError('Неверное имя пользователя или пароль')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="card">
            <motion.h1 
              className="text-4xl font-bold mb-6 text-center gradient-text"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Вход в систему
            </motion.h1>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  {...register('username', { required: 'Обязательное поле' })}
                  className="input-field"
                  placeholder="Введите имя пользователя"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Обязательное поле' })}
                    className="input-field pr-10"
                    placeholder="Введите пароль"
                    autoComplete="current-password"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

