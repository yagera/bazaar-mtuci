'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Plus, X, Upload } from 'lucide-react'
import Navbar from '@/components/Navbar'
import TimeInput from '@/components/TimeInput'
import { itemsApi, Item, ItemUpdate } from '@/lib/items'
import { authApi } from '@/lib/auth'
import api from '@/lib/api'

interface AvailabilityForm {
  date: string
  start_time: string
  end_time: string
}

interface ItemForm extends Omit<ItemUpdate, 'availabilities'> {
  availabilities: AvailabilityForm[]
}

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = parseInt(params.id as string)
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const getToday = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = getToday()

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.getById(itemId),
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then(setCurrentUser)
        .catch(() => setCurrentUser(null))
    }
  }, [])

  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm<ItemForm>({
    defaultValues: {
      availabilities: [],
    },
  })

  const imageUrl = watch('image_url')

  useEffect(() => {
    if (item) {
      if (currentUser && currentUser.id !== item.owner_id) {
        alert('У вас нет прав для редактирования этого объявления')
        router.push('/my-items')
        return
      }

      reset({
        title: item.title,
        description: item.description || '',
        price_per_hour: parseFloat(item.price_per_hour),
        price_per_day: item.price_per_day ? parseFloat(item.price_per_day) : undefined,
        image_url: item.image_url || '',
        availabilities: item.availabilities.map(avail => ({
          date: avail.date,
          start_time: avail.start_time,
          end_time: avail.end_time,
        })),
      })
      if (item.image_url) {
        setPreviewUrl(item.image_url)
      }
    }
  }, [item, currentUser, reset, router])

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'availabilities',
  })

  const mutation = useMutation({
    mutationFn: (data: ItemUpdate) => itemsApi.update(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['my-items'] })
      router.push('/my-items')
    },
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const s3Url = response.data.url
      URL.revokeObjectURL(localPreview)
      setValue('image_url', s3Url)
      setPreviewUrl(s3Url)
    } catch (error: any) {
      URL.revokeObjectURL(localPreview)
      setPreviewUrl(null)
      alert(error.response?.data?.detail || 'Ошибка загрузки изображения')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = (data: ItemForm) => {
    if (!data.image_url && !previewUrl && !item?.image_url) {
      alert('Пожалуйста, загрузите изображение')
      return
    }
    
    const updateData: ItemUpdate = {
      ...data,
      is_active: item?.is_active === false ? true : undefined, // Автоматически публикуем, если было снято
    }
    
    mutation.mutate(updateData)
  }

  if (itemLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse text-gray-900 dark:text-gray-100">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-900 dark:text-gray-100">Объявление не найдено</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Редактировать объявление
            </h1>
            {!item.is_active && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                Снято с публикации
              </span>
            )}
          </div>

          {!item.is_active && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Это объявление снято с публикации. После сохранения изменений оно будет автоматически опубликовано.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Название *
              </label>
              <input
                type="text"
                {...register('title', { required: 'Обязательное поле' })}
                className="input-field"
                placeholder="Например: Игровой ноутбук"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Описание
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field"
                placeholder="Опишите вашу вещь..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Цена за час (₽) *
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  {...register('price_per_hour', {
                    required: 'Обязательное поле',
                    min: { value: 0, message: 'Минимум 0' },
                    valueAsNumber: true,
                  })}
                  className="input-field"
                />
                {errors.price_per_hour && (
                  <p className="mt-1 text-sm text-red-600">{errors.price_per_hour.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Цена за день (₽)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  {...register('price_per_day', {
                    min: { value: 0, message: 'Минимум 0' },
                    valueAsNumber: true,
                  })}
                  className="input-field"
                />
                {errors.price_per_day && (
                  <p className="mt-1 text-sm text-red-600">{errors.price_per_day.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Изображение *
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              
              <div className="space-y-3">
                {!previewUrl && !imageUrl && (
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 border-2 border-dashed border-primary-300 rounded-xl hover:border-primary-500 transition-all disabled:opacity-50 bg-primary-50 hover:bg-primary-100"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-950"></div>
                        <span className="text-primary-950 font-medium">Загрузка...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-primary-950" />
                        <span className="text-primary-950 font-medium">Загрузить изображение</span>
                      </>
                    )}
                  </motion.button>
                )}
                
                {(previewUrl || imageUrl) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-4 border-primary-300 bg-white shadow-xl min-h-[400px]">
                      <img
                        key={previewUrl || imageUrl}
                        src={previewUrl || imageUrl || ''}
                        alt="Preview"
                        className="w-full h-[400px] object-contain bg-white image-preview-sharp"
                        loading="eager"
                        decoding="async"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Загрузка...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (previewUrl && previewUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(previewUrl)
                        }
                        setPreviewUrl(null)
                        setValue('image_url', '')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-2xl backdrop-blur-sm border-2 border-white"
                      disabled={uploading}
                    >
                      <X className="h-6 w-6" />
                    </motion.button>
                    {!uploading && (
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <motion.button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-white/95 text-gray-800 rounded-xl hover:bg-white transition-all text-sm font-semibold shadow-xl backdrop-blur-sm border-2 border-primary-200"
                        >
                          Изменить изображение
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Поддерживаются форматы: JPG, PNG, WebP, GIF. Максимальный размер: 5MB
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Расписание доступности
                </label>
                <button
                  type="button"
                  onClick={() => append({ date: '', start_time: '09:00', end_time: '18:00' })}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Добавить</span>
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Расписание {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Дата *
                        </label>
                        <input
                          type="date"
                          {...register(`availabilities.${index}.date`, {
                            required: 'Обязательное поле'
                          })}
                          min={today}
                          className="input-field"
                        />
                        {errors.availabilities?.[index]?.date && (
                          <p className="mt-1 text-xs text-red-600">{errors.availabilities[index]?.date?.message}</p>
                        )}
                      </div>

                      <div>
                        <Controller
                          name={`availabilities.${index}.start_time`}
                          control={control}
                          defaultValue="09:00"
                          render={({ field }) => (
                            <TimeInput
                              value={field.value || "09:00"}
                              onChange={field.onChange}
                              label="Начало"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <Controller
                          name={`availabilities.${index}.end_time`}
                          control={control}
                          defaultValue="18:00"
                          render={({ field }) => (
                            <TimeInput
                              value={field.value || "18:00"}
                              onChange={field.onChange}
                              label="Конец"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={mutation.isPending || uploading}
                className="btn-primary flex-1"
              >
                {mutation.isPending ? 'Сохранение...' : item.is_active ? 'Сохранить изменения' : 'Сохранить и опубликовать'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  )
}

