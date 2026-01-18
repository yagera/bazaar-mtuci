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
  'nav.favorites': { ru: 'Избранное', en: 'Favorites' },
  'nav.admin': { ru: 'Админ', en: 'Admin' },
  'nav.adminPanel': { ru: 'Админ панель', en: 'Admin Panel' },
  'nav.moderation': { ru: 'Модерация', en: 'Moderation' },
  'nav.administration': { ru: 'Администрирование', en: 'Administration' },
  'home.title': { ru: 'Аренда и продажа вещей для общежития', en: 'Rent and sale items for dormitory' },
  'home.subtitle': { ru: 'Найди нужную вещь или размести своё объявление', en: 'Find what you need or post your ad' },
  'home.search': { ru: 'Поиск по названию...', en: 'Search by name...' },
  'home.dormitory': { ru: 'Общежитие', en: 'Dormitory' },
  'home.dormitoryAll': { ru: 'Все общежития', en: 'All dormitories' },
  'home.dormitory1': { ru: 'Общежитие №1', en: 'Dormitory №1' },
  'home.dormitory2': { ru: 'Общежитие №2', en: 'Dormitory №2' },
  'home.dormitory3': { ru: 'Общежитие №3', en: 'Dormitory №3' },
  'home.priceFrom': { ru: 'Цена от (₽/час)', en: 'Price from (₽/hour)' },
  'home.priceTo': { ru: 'Цена до (₽/час)', en: 'Price to (₽/hour)' },
  'home.noItems': { ru: 'Объявления не найдены', en: 'No items found' },
  'item.dormitory': { ru: 'Общ.', en: 'Dorm.' },
  
  // Categories
  'category.title': { ru: 'Категория', en: 'Category' },
  'category.select': { ru: 'Выберите категорию', en: 'Select category' },
  'category.search': { ru: 'Поиск категории...', en: 'Search category...' },
  'category.clear': { ru: 'Очистить выбор', en: 'Clear selection' },
  'category.reset': { ru: 'Сбросить', en: 'Reset' },
  'category.removeFilter': { ru: 'Убрать фильтр категории', en: 'Remove category filter' },
  'category.notFound': { ru: 'Категория не найдена', en: 'Category not found' },
  'category.electronics': { ru: 'Электроника', en: 'Electronics' },
  'category.clothing': { ru: 'Одежда и обувь', en: 'Clothing & Shoes' },
  'category.furniture': { ru: 'Мебель', en: 'Furniture' },
  'category.books': { ru: 'Книги и учебники', en: 'Books & Textbooks' },
  'category.sports': { ru: 'Спорт и отдых', en: 'Sports & Recreation' },
  'category.kitchen': { ru: 'Кухонные принадлежности', en: 'Kitchen Supplies' },
  'category.tools': { ru: 'Инструменты', en: 'Tools' },
  'category.games': { ru: 'Игры и развлечения', en: 'Games & Entertainment' },
  'category.cosmetics': { ru: 'Косметика и гигиена', en: 'Cosmetics & Hygiene' },
  'category.other': { ru: 'Другое', en: 'Other' },
  
  // Profile
  'profile.title': { ru: 'Профиль', en: 'Profile' },
  'profile.edit': { ru: 'Редактировать', en: 'Edit' },
  'profile.save': { ru: 'Сохранить', en: 'Save' },
  'profile.cancel': { ru: 'Отмена', en: 'Cancel' },
  'profile.email': { ru: 'Email', en: 'Email' },
  'profile.username': { ru: 'Имя пользователя', en: 'Username' },
  'profile.fullName': { ru: 'ФИО', en: 'Full Name' },
  'profile.dormitory': { ru: 'Общежитие', en: 'Dormitory' },
  'profile.dormitoryNotSelected': { ru: 'Не выбрано', en: 'Not selected' },
  'profile.roomNumber': { ru: 'Номер комнаты', en: 'Room Number' },
  'profile.telegramUsername': { ru: 'Telegram username', en: 'Telegram username' },
  'profile.requiredField': { ru: 'Обязательное поле', en: 'Required field' },
  'profile.updated': { ru: 'Профиль обновлен', en: 'Profile updated' },
  'profile.updateError': { ru: 'Ошибка обновления', en: 'Update error' },
  
  // Statistics
  'stats.totalItems': { ru: 'Всего объявлений', en: 'Total Items' },
  'stats.active': { ru: 'активных', en: 'active' },
  'stats.views': { ru: 'Просмотры', en: 'Views' },
  'stats.total': { ru: 'всего', en: 'total' },
  'stats.inFavorites': { ru: 'В избранном', en: 'In Favorites' },
  'stats.additions': { ru: 'добавлений', en: 'additions' },
  'stats.earnings': { ru: 'Доход', en: 'Earnings' },
  'stats.earned': { ru: 'заработано', en: 'earned' },
  'stats.bookingsAsOwner': { ru: 'Бронирования как владелец', en: 'Bookings as Owner' },
  'stats.bookingsAsRenter': { ru: 'Бронирования как арендатор', en: 'Bookings as Renter' },
  'stats.all': { ru: 'Всего', en: 'Total' },
  'stats.confirmed': { ru: 'Подтверждено', en: 'Confirmed' },
  'stats.completed': { ru: 'Завершено', en: 'Completed' },
  
  // Moderation
  'moderation.title': { ru: 'Панель модератора', en: 'Moderation Panel' },
  'moderation.items': { ru: 'Объявления', en: 'Items' },
  'moderation.reports': { ru: 'Жалобы', en: 'Reports' },
  'moderation.pending': { ru: 'На модерации', en: 'Pending' },
  'moderation.approved': { ru: 'Одобрено', en: 'Approved' },
  'moderation.rejected': { ru: 'Отклонено', en: 'Rejected' },
  'moderation.onReview': { ru: 'На рассмотрении', en: 'On Review' },
  'moderation.approve': { ru: 'Одобрить', en: 'Approve' },
  'moderation.approving': { ru: 'Одобрение...', en: 'Approving...' },
  'moderation.reject': { ru: 'Отклонить', en: 'Reject' },
  'moderation.rejecting': { ru: 'Отклонение...', en: 'Rejecting...' },
  'moderation.approveReport': { ru: 'Одобрить жалобу', en: 'Approve Report' },
  'moderation.dismissReport': { ru: 'Отклонить', en: 'Dismiss' },
  'moderation.itemsStats': { ru: 'Статистика объявлений', en: 'Items Statistics' },
  'moderation.reportsStats': { ru: 'Статистика жалоб', en: 'Reports Statistics' },
  'moderation.adminStats': { ru: 'Административная статистика', en: 'Administrative Statistics' },
  'moderation.yourActivity': { ru: 'Ваша активность', en: 'Your Activity' },
  'moderation.approvedReports': { ru: 'Одобрено жалоб', en: 'Approved Reports' },
  'moderation.dismissedReports': { ru: 'Отклонено жалоб', en: 'Dismissed Reports' },
  'moderation.today': { ru: 'Сегодня', en: 'Today' },
  'moderation.week': { ru: 'За неделю', en: 'This Week' },
  'moderation.month': { ru: 'За месяц', en: 'This Month' },
  'moderation.totalItems': { ru: 'Всего объявлений', en: 'Total Items' },
  'moderation.totalReports': { ru: 'Всего жалоб', en: 'Total Reports' },
  'moderation.processedToday': { ru: 'Обработано сегодня', en: 'Processed Today' },
  'moderation.processedWeek': { ru: 'Обработано за неделю', en: 'Processed This Week' },
  'moderation.byYou': { ru: 'вами', en: 'by you' },
  'moderation.users': { ru: 'Пользователи', en: 'Users' },
  'moderation.bookings': { ru: 'Бронирования', en: 'Bookings' },
  'moderation.activeItems': { ru: 'Активные объявления', en: 'Active Items' },
  'moderation.rejectReason': { ru: 'Причина отклонения (необязательно)', en: 'Rejection reason (optional)' },
  'moderation.confirmReject': { ru: 'Подтвердить отклонение', en: 'Confirm Rejection' },
  'moderation.confirm': { ru: 'Подтвердить', en: 'Confirm' },
  'moderation.cancel': { ru: 'Отмена', en: 'Cancel' },
  'moderation.warning': { ru: 'Внимание! Объявление будет скрыто.', en: 'Warning! The item will be hidden.' },
  'moderation.itemStaysActive': { ru: 'Объявление останется активным.', en: 'The item will remain active.' },
  'moderation.noItems': { ru: 'Нет объявлений на модерации', en: 'No items pending moderation' },
  'moderation.noReports': { ru: 'Нет жалоб на рассмотрении', en: 'No reports pending review' },
  'moderation.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'moderation.noPhoto': { ru: 'Нет фото', en: 'No photo' },
  
  // Common
  'common.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'common.notFound': { ru: 'Не найдено', en: 'Not Found' },
  'common.error': { ru: 'Ошибка', en: 'Error' },
  'common.success': { ru: 'Успешно', en: 'Success' },
  
  // Register
  'register.roomNumber': { ru: 'Номер комнаты', en: 'Room Number' },
  'register.roomNumberPlaceholder': { ru: 'Например: 101', en: 'For example: 101' },
  'register.telegramUsername': { ru: 'Telegram username', en: 'Telegram username' },
  'register.password': { ru: 'Пароль', en: 'Password' },
  'register.passwordPlaceholder': { ru: 'Минимум 6 символов', en: 'Minimum 6 characters' },
  'register.passwordStrength': { ru: 'Надежность пароля:', en: 'Password strength:' },
  'register.passwordWeak': { ru: 'Слабый', en: 'Weak' },
  'register.passwordMedium': { ru: 'Средний', en: 'Medium' },
  'register.passwordStrong': { ru: 'Сильный', en: 'Strong' },
  'register.passwordMinLength': { ru: 'Минимум 6 символов', en: 'Minimum 6 characters' },
  'register.passwordMismatch': { ru: 'Пароли не совпадают', en: 'Passwords do not match' },
  'register.selectDormitory': { ru: 'Выберите общежитие', en: 'Select dormitory' },
  'register.registering': { ru: 'Регистрация...', en: 'Registering...' },
  'register.passwordsMatch': { ru: 'Пароли совпадают', en: 'Passwords match' },
  'register.submit': { ru: 'Зарегистрироваться', en: 'Register' },
  'register.haveAccount': { ru: 'Уже есть аккаунт?', en: 'Already have an account?' },
  'register.login': { ru: 'Войти', en: 'Login' },
  
  // My Items
  'myItems.title': { ru: 'Мои объявления', en: 'My Items' },
  'myItems.newItem': { ru: 'Новое объявление', en: 'New Item' },
  'myItems.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'myItems.noItems': { ru: 'У вас пока нет объявлений', en: 'You have no items yet' },
  'myItems.createFirst': { ru: 'Создать первое объявление', en: 'Create your first item' },
  'myItems.deleteConfirm': { ru: 'Вы уверены, что хотите удалить объявление? Это действие нельзя отменить.', en: 'Are you sure you want to delete this item? This action cannot be undone.' },
  'myItems.deleted': { ru: 'Объявление удалено', en: 'Item deleted' },
  'myItems.deleteError': { ru: 'Ошибка при удалении объявления', en: 'Error deleting item' },
  'myItems.restored': { ru: 'Объявление восстановлено', en: 'Item restored' },
  'myItems.restoredAndModeration': { ru: 'Объявление восстановлено и отправлено на модерацию', en: 'Item restored and sent for moderation' },
  'myItems.restoreError': { ru: 'Ошибка при восстановлении объявления', en: 'Error restoring item' },
  'myItems.restoreConfirmRejected': { ru: 'Объявление будет восстановлено и отправлено на повторную модерацию. Продолжить?', en: 'Item will be restored and sent for re-moderation. Continue?' },
  'myItems.restoreConfirm': { ru: 'Вы уверены, что хотите восстановить объявление?', en: 'Are you sure you want to restore this item?' },
  'myItems.editTitle': { ru: 'Редактировать объявление', en: 'Edit item' },
  'myItems.restoreTitle': { ru: 'Восстановить объявление', en: 'Restore item' },
  'myItems.deleteTitle': { ru: 'Удалить объявление', en: 'Delete item' },
  'myItems.active': { ru: 'Активно', en: 'Active' },
  'myItems.inactive': { ru: 'Неактивно', en: 'Inactive' },
  'myItems.noPhoto': { ru: 'Нет фото', en: 'No photo' },
  'myItems.pricePerHour': { ru: '₽/час', en: '₽/hour' },
  'myItems.pricePerDay': { ru: '₽/день', en: '₽/day' },
  'myItems.price': { ru: '₽', en: '₽' },
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

