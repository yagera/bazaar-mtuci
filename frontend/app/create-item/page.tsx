'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react'
import Navbar from '@/components/Navbar'
import TimeInput from '@/components/TimeInput'
import { itemsApi, ItemCreate } from '@/lib/items'
import api from '@/lib/api'

interface AvailabilityForm {
  date?: string | null  // Дата в формате YYYY-MM-DD (для обратной совместимости)
  start_date: string  // Начало диапазона дат в формате YYYY-MM-DD
  end_date: string  // Конец диапазона дат в формате YYYY-MM-DD
  start_time: string
  end_time: string
}

interface ItemForm extends Omit<ItemCreate, 'availabilities'> {
  availabilities: AvailabilityForm[]
}


export default function CreateItemPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const getToday = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = getToday()
  
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<ItemForm>({
    defaultValues: {
      availabilities: [],
    },
  })

  const imageUrl = watch('image_url')

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
    mutationFn: (data: ItemCreate) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
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
    if (!data.image_url && !previewUrl) {
      alert('Пожалуйста, загрузите изображение')
      return
    }
    
    const itemData: ItemCreate = {
      ...data,
      availabilities: data.availabilities.map(avail => ({
        start_date: avail.start_date,
        end_date: avail.end_date,
        start_time: avail.start_time,
        end_time: avail.end_time,
      })),
    }
    
    mutation.mutate(itemData)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Разместить объявление
          </h1>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена за час (₽) *
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  {...register('price_per_hour', {
                    required: 'Обязательное поле',
                    min: { value: 0, message: 'Минимум 0' },
                  })}
                  className="input-field"
                />
                {errors.price_per_hour && (
                  <p className="mt-1 text-sm text-red-600">{errors.price_per_hour.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена за день (₽)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  {...register('price_per_day', {
                    min: { value: 0, message: 'Минимум 0' },
                  })}
                  className="input-field"
                />
                {errors.price_per_day && (
                  <p className="mt-1 text-sm text-red-600">{errors.price_per_day.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          const parent = target.parentElement
                          if (parent) {
                            target.style.display = 'none'
                            if (!parent.querySelector('.image-error')) {
                              const errorDiv = document.createElement('div')
                              errorDiv.className = 'image-error w-full h-[400px] flex items-center justify-center text-gray-500'
                              errorDiv.innerHTML = `
                                <div class="text-center p-4">
                                  <p class="text-sm font-medium mb-2 text-red-600">Ошибка загрузки изображения</p>
                                  <p class="text-xs text-gray-400 break-all max-w-full">${(previewUrl || imageUrl || 'Нет URL').substring(0, 100)}</p>
                                </div>
                              `
                              parent.appendChild(errorDiv)
                            }
                          }
                        }}
                        onLoad={() => {
                          const errorMsg = document.querySelector('.image-error')
                          if (errorMsg) {
                            errorMsg.remove()
                          }
                        }}
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
                
                <p className="text-xs text-gray-500">
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
                  onClick={() => append({ start_date: today, end_date: today, start_time: '09:00', end_time: '18:00' })}
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Дата начала *
                        </label>
                        <input
                          type="date"
                          {...register(`availabilities.${index}.start_date`, {
                            required: 'Обязательное поле'
                          })}
                          min={today}
                          className="input-field"
                        />
                        {errors.availabilities?.[index]?.start_date && (
                          <p className="mt-1 text-xs text-red-600">{errors.availabilities[index]?.start_date?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Дата окончания *
                        </label>
                        <input
                          type="date"
                          {...register(`availabilities.${index}.end_date`, {
                            required: 'Обязательное поле',
                            validate: (value) => {
                              const startDate = watch(`availabilities.${index}.start_date`)
                              if (startDate && value < startDate) {
                                return 'Дата окончания должна быть не раньше даты начала'
                              }
                              return true
                            }
                          })}
                          min={watch(`availabilities.${index}.start_date`) || today}
                          className="input-field"
                        />
                        {errors.availabilities?.[index]?.end_date && (
                          <p className="mt-1 text-xs text-red-600">{errors.availabilities[index]?.end_date?.message}</p>
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
                disabled={mutation.isPending || uploading || (!previewUrl && !imageUrl)}
                className="btn-primary flex-1"
              >
                {mutation.isPending ? 'Создание...' : 'Разместить объявление'}
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

