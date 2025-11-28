'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, AlertCircle, FileText } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { itemsApi, Item, ModerationStatus } from '@/lib/items'
import { moderationApi } from '@/lib/moderation'
import { reportsApi, Report, ReportStatus } from '@/lib/reports'
import { authApi, UserRole } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ModerationPage() {
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
    enabled: activeTab === 'items' && currentUser?.role,
  })

  const { data: pendingReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'pending'],
    queryFn: () => reportsApi.getPending(),
    enabled: activeTab === 'reports' && currentUser?.role,
  })

  const { data: stats } = useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => moderationApi.getStats(),
    enabled: !!currentUser?.role,
  })

  const approveMutation = useMutation({
    mutationFn: moderationApi.approveItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ itemId, comment }: { itemId: number; comment?: string }) =>
      moderationApi.rejectItem(itemId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setRejectComment('')
    },
  })

  const resolveReportMutation = useMutation({
    mutationFn: reportsApi.resolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const dismissReportMutation = useMutation({
    mutationFn: reportsApi.dismiss,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Панель модератора
          </h1>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card">
                <div className="text-sm text-gray-600 dark:text-gray-400">На модерации</div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600 dark:text-gray-400">Одобрено</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.approved}
                </div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600 dark:text-gray-400">Отклонено</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.rejected}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-4 px-4 font-medium ${
                activeTab === 'items'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Объявления ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-4 px-4 font-medium ${
                activeTab === 'reports'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Жалобы ({pendingReports.length})
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
            <div className="space-y-4">
              {reportsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Загрузка...</p>
                </div>
              ) : pendingReports.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-500">Нет жалоб на рассмотрении</p>
                </div>
              ) : (
                pendingReports.map((report: Report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onResolve={() => resolveReportMutation.mutate(report.id)}
                    onDismiss={() => dismissReportMutation.mutate(report.id)}
                    isResolving={resolveReportMutation.isPending}
                    isDismissing={dismissReportMutation.isPending}
                  />
                ))
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
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [comment, setComment] = useState('')

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Цена: {parseFloat(item.price_per_hour).toFixed(0)} ₽/час</span>
            <span>Владелец: {item.owner.username}</span>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={onApprove}
            disabled={isApproving || isRejecting}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
            title="Одобрить"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowRejectForm(!showRejectForm)}
            disabled={isApproving || isRejecting}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            title="Отклонить"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {showRejectForm && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Причина отклонения (необязательно)"
            rows={2}
            className="input-field mb-2"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => {
                onReject(comment || undefined)
                setShowRejectForm(false)
                setComment('')
              }}
              className="btn-secondary"
            >
              Отклонить
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false)
                setComment('')
              }}
              className="btn-secondary"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
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
  const reasonLabels: Record<string, string> = {
    inappropriate_content: 'Неуместный контент',
    spam: 'Спам',
    fake: 'Поддельное объявление',
    scam: 'Мошенничество',
    other: 'Другое',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Жалоба #{report.id}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Причина: {reasonLabels[report.reason] || report.reason}
          </p>
          {report.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-2">{report.description}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Объявление: {report.item?.title || `ID: ${report.item_id}`}
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={onResolve}
            disabled={isResolving || isDismissing}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            title="Принять жалобу и скрыть объявление"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={onDismiss}
            disabled={isResolving || isDismissing}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
            title="Отклонить жалобу"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}


