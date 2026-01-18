import { api } from './api'

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  FAKE = 'fake',
  SCAM = 'scam',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export interface Report {
  id: number
  item_id: number
  reporter_id: number
  reason: ReportReason
  description?: string
  status: ReportStatus
  reviewed_by_id?: number
  reviewed_at?: string
  created_at: string
  item?: any
  reporter?: any
  reviewer?: any
}

export interface ReportCreate {
  item_id: number
  reason: ReportReason
  description?: string
}

export interface ReportUpdate {
  status?: ReportStatus
  description?: string
}

export const reportsApi = {
  create: async (data: ReportCreate): Promise<Report> => {
    const response = await api.post('/reports/', data)
    return response.data
  },

  getAll: async (status?: ReportStatus): Promise<Report[]> => {
    const params = status ? { status } : {}
    const response = await api.get('/reports/', { params })
    return response.data
  },

  getPending: async (): Promise<Report[]> => {
    const response = await api.get('/reports/pending')
    return response.data
  },

  getById: async (id: number): Promise<Report> => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  update: async (id: number, data: ReportUpdate): Promise<Report> => {
    const response = await api.put(`/reports/${id}`, data)
    return response.data
  },

  resolve: async (id: number): Promise<Report> => {
    const response = await api.post(`/reports/${id}/resolve`)
    return response.data
  },

  dismiss: async (id: number): Promise<Report> => {
    const response = await api.post(`/reports/${id}/dismiss`)
    return response.data
  },

  getStats: async (): Promise<{ pending: number; resolved: number; dismissed: number }> => {
    const response = await api.get('/reports/stats/summary')
    return response.data
  },
}





