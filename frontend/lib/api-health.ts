import axios from 'axios'

/**
 * Проверяет доступность API сервера
 */
export async function checkApiHealth(): Promise<{ available: boolean; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  const healthURL = API_URL.replace('/api/v1', '') + '/health'
  
  try {
    const response = await axios.get(healthURL, {
      timeout: 5000,
      validateStatus: (status) => status < 500, // Принимаем любые статусы кроме 5xx
    })
    
    if (response.status === 200 && response.data?.status === 'healthy') {
      return { available: true }
    } else {
      return { 
        available: false, 
        error: `Сервер вернул статус ${response.status}` 
      }
    }
  } catch (error: any) {
    let errorMessage = 'Неизвестная ошибка'
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Соединение отклонено. Бэкенд не запущен или недоступен.'
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = 'Превышено время ожидания. Сервер не отвечает.'
    } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      errorMessage = 'Ошибка сети. Проверьте подключение.'
    } else {
      errorMessage = error.message || 'Ошибка подключения'
    }
    
    return { 
      available: false, 
      error: errorMessage 
    }
  }
}



