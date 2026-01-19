'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, AlertCircle, FileText, User, TrendingUp, Calendar, Users, Package, Activity, BarChart3, Award } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { itemsApi, Item, ModerationStatus } from '@/lib/items'
import { moderationApi, ModerationDetailedStats } from '@/lib/moderation'
import { reportsApi, Report, ReportStatus } from '@/lib/reports'
import { authApi, UserRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useLanguage } from '@/lib/i18n'

export default function ModerationPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'items' | 'reports'>('items')
  const [rejectComment, setRejectComment] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe()
        .then((user) => {
          setCurrentUser(user)
          if (user.role !== UserRole.MODERATOR && user.role !== UserRole.ADMIN) {
            router.push('/')
          }
        })
        .catch(() => router.push('/'))
    } else {
      router.push('/')
    }
  }, [router])

  const { data: pendingItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['moderation', 'pending-items'],
    queryFn: () => moderationApi.getPendingItems(),
    enabled: activeTab === 'items' && !!currentUser?.role,
    refetchInterval: 5000, // Обновление каждые 5 секунд
  })

  const { data: pendingReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'pending'],
    queryFn: () => reportsApi.getPending(),
    enabled: activeTab === 'reports' && !!currentUser?.role,
    refetchInterval: 5000, // Обновление каждые 5 секунд
  })

  const { data: stats } = useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => moderationApi.getStats(),
    enabled: !!currentUser?.role,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  })

  const { data: detailedStats } = useQuery<ModerationDetailedStats>({
    queryKey: ['moderation', 'detailed-stats'],
    queryFn: () => moderationApi.getDetailedStats(),
    enabled: !!currentUser?.role,
    refetchInterval: 15000, // Обновление каждые 15 секунд
  })

  const { data: reportStats } = useQuery({
    queryKey: ['reports', 'stats'],
    queryFn: () => reportsApi.getStats(),
    enabled: activeTab === 'reports' && !!currentUser?.role,
    refetchInterval: 10000, // Обновление каждые 10 секунд
  })

  const approveMutation = useMutation({
    mutationFn: moderationApi.approveItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'pending-items'] })
      queryClient.invalidateQueries({ queryKey: ['moderation', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['moderation', 'detailed-stats'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
    onError: (error: any) => {
      console.error('Ошибка при одобрении объявления:', error)
      alert(error.response?.data?.detail || 'Ошибка при одобрении объявления')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ itemId, comment }: { itemId: number; comment?: string }) =>
      moderationApi.rejectItem(itemId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'pending-items'] })
      queryClient.invalidateQueries({ queryKey: ['moderation', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['moderation', 'detailed-stats'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setRejectComment('')
    },
    onError: (error: any) => {
      console.error('Ошибка при отклонении объявления:', error)
      alert(error.response?.data?.detail || 'Ошибка при отклонении объявления')
    },
  })

  const resolveReportMutation = useMutation({
    mutationFn: reportsApi.resolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['moderation', 'detailed-stats'] })
    },
  })

  const dismissReportMutation = useMutation({
    mutationFn: reportsApi.dismiss,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['moderation', 'detailed-stats'] })
    },
  })

  if (!currentUser || (currentUser.role !== UserRole.MODERATOR && currentUser.role !== UserRole.ADMIN)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#212330]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('moderation.title')}
            </h1>
          </div>

          {/* Детальная статистика */}
          {detailedStats && (
            <ModerationStatsDashboard stats={detailedStats} />
          )}

          {activeTab === 'items' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.pending')}</div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </div>
              </div>
              <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.approved')}</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.approved}
                </div>
              </div>
              <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.rejected')}</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.rejected}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && reportStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.onReview')}</div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {reportStats.pending}
                </div>
              </div>
              <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.approved')}</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {reportStats.resolved}
                </div>
              </div>
              <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.rejected')}</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {reportStats.dismissed}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('items')}
              className={`relative pb-4 px-4 font-medium flex items-center space-x-2 ${
                activeTab === 'items'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span>{t('moderation.items')}</span>
              {pendingItems.length > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-primary-600 dark:bg-primary-500 rounded-full">
                  {pendingItems.length > 99 ? '99+' : pendingItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`relative pb-4 px-4 font-medium flex items-center space-x-2 ${
                activeTab === 'reports'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span>{t('moderation.reports')}</span>
              {pendingReports.length > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-orange-600 dark:bg-orange-500 rounded-full">
                  {pendingReports.length > 99 ? '99+' : pendingReports.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'items' && (
            <div className="space-y-4">
              {itemsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Загрузка...</p>
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-500">Нет объявлений на модерации</p>
                </div>
              ) : (
                pendingItems.map((item: Item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onApprove={() => approveMutation.mutate(item.id)}
                    onReject={(comment) => rejectMutation.mutate({ itemId: item.id, comment })}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              {reportsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-56 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : pendingReports.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-500">{t('moderation.noReports')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingReports.map((report: Report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onResolve={() => resolveReportMutation.mutate(report.id)}
                      onDismiss={() => dismissReportMutation.mutate(report.id)}
                      isResolving={resolveReportMutation.isPending}
                      isDismissing={dismissReportMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

function ItemCard({
  item,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  item: Item
  onApprove: () => void
  onReject: (comment?: string) => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const { t } = useLanguage()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectComment, setRejectComment] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start gap-4">
        {item.image_url && (
          <Link href={`/items/${item.id}`} className="flex-shrink-0">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-32 h-32 object-cover rounded-lg"
            />
          </Link>
        )}
        <div className="flex-1">
          <Link href={`/items/${item.id}`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400">
              {item.title}
            </h3>
          </Link>
          {item.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{item.owner.username}</span>
            </div>
            {item.dormitory && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Общежитие №{item.dormitory}</span>
              </div>
            )}
          </div>
          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {isApproving ? t('moderation.approving') : t('moderation.approve')}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isApproving || isRejecting}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                {t('moderation.reject')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Причина отклонения (необязательно)"
                className="input-field w-full min-h-[80px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onReject(rejectComment || undefined)
                    setShowRejectForm(false)
                    setRejectComment('')
                  }}
                  disabled={isApproving || isRejecting}
                  className="btn-secondary flex-1 disabled:opacity-50"
                >
                  {isRejecting ? 'Отклонение...' : 'Подтвердить отклонение'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectComment('')
                  }}
                  disabled={isApproving || isRejecting}
                  className="btn-secondary disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ReportCard({
  report,
  onResolve,
  onDismiss,
  isResolving,
  isDismissing,
}: {
  report: Report
  onResolve: () => void
  onDismiss: () => void
  isResolving: boolean
  isDismissing: boolean
}) {
  const [showConfirmResolve, setShowConfirmResolve] = useState(false)
  const [showConfirmDismiss, setShowConfirmDismiss] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <Link href={`/items/${report.item.id}`}>
        <div className="relative h-56 rounded-xl mb-4 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {report.item.image_url ? (
            <img
              src={report.item.image_url}
              alt={report.item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {t('moderation.noPhoto')}
            </div>
          )}
        </div>
      </Link>

      <div className="mb-4">
        <Link href={`/items/${report.item.id}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400">
            {report.item.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <User className="h-4 w-4" />
          <span>От: {report.reporter.username}</span>
        </div>
        <div className="inline-block px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded text-xs font-medium mb-2">
          {report.reason === 'inappropriate_content' && 'Неуместный контент'}
          {report.reason === 'spam' && 'Спам'}
          {report.reason === 'fake' && 'Подделка'}
          {report.reason === 'scam' && 'Мошенничество'}
          {report.reason === 'other' && 'Другое'}
        </div>
        {report.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {report.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {!showConfirmResolve && !showConfirmDismiss && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmResolve(true)
              }}
              disabled={isResolving || isDismissing}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Одобрить жалобу
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirmDismiss(true)
              }}
              disabled={isResolving || isDismissing}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Отклонить
            </button>
          </div>
        )}

        {showConfirmResolve ? (
          <div className="space-y-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-800 dark:text-red-200 font-medium mb-1">
                {t('moderation.warning')}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onResolve()
                  setShowConfirmResolve(false)
                }}
                disabled={isResolving || isDismissing}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isResolving ? t('moderation.loading') : t('moderation.confirm')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfirmResolve(false)
                }}
                disabled={isResolving || isDismissing}
                className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {t('moderation.cancel')}
              </button>
            </div>
          </div>
        ) : (
          showConfirmDismiss && (
            <div className="space-y-2">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                  {t('moderation.itemStaysActive')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDismiss()
                    setShowConfirmDismiss(false)
                  }}
                  disabled={isResolving || isDismissing}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {isDismissing ? t('moderation.loading') : t('moderation.confirm')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowConfirmDismiss(false)
                  }}
                  disabled={isResolving || isDismissing}
                  className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {t('moderation.cancel')}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </motion.div>
  )
}

function ModerationStatsDashboard({ stats }: { stats: ModerationDetailedStats }) {
  const { t } = useLanguage()
  return (
    <div className="space-y-6 mb-8">
      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label={t('moderation.totalItems')}
          value={stats.items.total}
          subValue={`${stats.items.pending} ${t('moderation.pending').toLowerCase()}`}
          gradient="from-blue-500 to-cyan-500"
          delay={0}
        />
        <StatCard
          icon={AlertCircle}
          label={t('moderation.totalReports')}
          value={stats.reports.total}
          subValue={`${stats.reports.pending} ${t('moderation.onReview').toLowerCase()}`}
          gradient="from-orange-500 to-red-500"
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          label={t('moderation.processedToday')}
          value={stats.moderator.items.today + stats.moderator.reports.today}
          subValue={t('moderation.byYou')}
          gradient="from-purple-500 to-pink-500"
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label={t('moderation.processedWeek')}
          value={stats.moderator.items.week + stats.moderator.reports.week}
          subValue={t('moderation.byYou')}
          gradient="from-green-500 to-emerald-500"
          delay={0.3}
        />
      </div>

      {/* Статистика по объявлениям */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Package className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('moderation.itemsStats')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.pending')}</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.items.pending}</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.approved')}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.items.approved}</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.rejected')}</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.items.rejected}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PeriodStatCard
            title={t('moderation.approved')}
            today={stats.items.periods.approved.today}
            week={stats.items.periods.approved.week}
            month={stats.items.periods.approved.month}
            color="green"
          />
          <PeriodStatCard
            title={t('moderation.rejected')}
            today={stats.items.periods.rejected.today}
            week={stats.items.periods.rejected.week}
            month={stats.items.periods.rejected.month}
            color="red"
          />
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('moderation.yourActivity')}</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.approved')}</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.moderator.items.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.rejected')}</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.moderator.items.rejected}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика по жалобам */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('moderation.reportsStats')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.onReview')}</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.reports.pending}</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.approved')}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.reports.resolved}</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('moderation.rejected')}</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.reports.dismissed}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PeriodStatCard
            title={t('moderation.approvedReports')}
            today={stats.reports.periods.resolved.today}
            week={stats.reports.periods.resolved.week}
            month={stats.reports.periods.resolved.month}
            color="green"
          />
          <PeriodStatCard
            title={t('moderation.dismissedReports')}
            today={stats.reports.periods.dismissed.today}
            week={stats.reports.periods.dismissed.week}
            month={stats.reports.periods.dismissed.month}
            color="red"
          />
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('moderation.yourActivity')}</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.approved')}</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.moderator.reports.resolved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.rejected')}</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.moderator.reports.dismissed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика для админов */}
      {stats.admin && stats.admin.users && stats.admin.bookings && stats.admin.items && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('moderation.adminStats')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('moderation.users')}</div>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.admin.users.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.admin.users.active} {t('stats.active')}</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('moderation.bookings')}</div>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.admin.bookings.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.admin.bookings.confirmed} {t('stats.confirmed').toLowerCase()}</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('moderation.activeItems')}</div>
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admin.items.active}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  gradient, 
  delay 
}: { 
  icon: any
  label: string
  value: string | number
  subValue?: string
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="relative">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradient} mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </div>
        {subValue && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {subValue}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function PeriodStatCard({
  title,
  today,
  week,
  month,
  color
}: {
  title: string
  today: number
  week: number
  month: number
  color: 'green' | 'red'
}) {
  const { t } = useLanguage()
  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400'
    }
  }
  
  const classes = colorClasses[color]
  
  return (
    <div className={`p-4 ${classes.bg} rounded-lg border ${classes.border}`}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{title}</div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.today')}</span>
          <span className={`text-lg font-bold ${classes.text}`}>{today}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.week')}</span>
          <span className={`text-lg font-bold ${classes.text}`}>{week}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('moderation.month')}</span>
          <span className={`text-lg font-bold ${classes.text}`}>{month}</span>
        </div>
      </div>
    </div>
  )
}
