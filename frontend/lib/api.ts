import axios from 'axios'

// Определяем URL API - используем переменную окружения или значение по умолчанию
// В браузере это будет работать с localhost, так как запросы идут от клиента
// Если фронтенд работает в Docker, но запросы идут из браузера, localhost:8000 должен работать
// так как порт проброшен на хост
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Убираем слэш в конце, если есть
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1)
}

// Логируем используемый URL (только на клиенте)
if (typeof window !== 'undefined') {
  console.log('API URL:', API_URL)
  console.log('NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL)
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
  withCredentials: false, // Отключаем credentials для упрощения CORS
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Логируем запросы в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url)
    }
  }
  return config
}, (error) => {
  console.error('Request Error:', error)
  return Promise.reject(error)
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка сетевых ошибок (когда сервер недоступен)
    if (!error.response) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown'
        }
      }
      
      console.error('Network Error Details:', errorDetails)
      
      // Определяем тип ошибки для более точного сообщения
      let errorMessage = 'Сервер недоступен. Проверьте подключение к интернету и попробуйте снова.'
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        errorMessage = `Не удалось подключиться к серверу по адресу ${errorDetails.config.fullURL}. Убедитесь, что бэкенд запущен и доступен на порту 8000.`
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = 'Превышено время ожидания ответа от сервера. Попробуйте позже.'
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = `Ошибка сети при обращении к ${errorDetails.config.fullURL}. Проверьте:\n1. Запущен ли бэкенд (docker ps | grep backend)\n2. Доступен ли порт 8000 (curl http://localhost:8000/health)\n3. Нет ли блокировки firewall`
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Ошибка CORS. Проверьте настройки CORS на сервере.'
      }
      
      // Преобразуем Network Error в более понятное сообщение
      error.response = {
        data: {
          detail: errorMessage,
          errorCode: error.code,
          attemptedURL: errorDetails.config.fullURL
        },
        status: 503,
        statusText: 'Service Unavailable'
      }
    }
    
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api




