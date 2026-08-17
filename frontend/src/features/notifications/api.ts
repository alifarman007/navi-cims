/** Notifications — the current user's inbox (bell popover in the header + optional full-page list). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { listParams } from '@/lib/utils'
import type { ListQuery, Page } from '@/types/api'

export interface Notification {
  id: number
  title: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
}

export const notificationsApi = {
  list: (q: ListQuery = {}) => api.get<Page<Notification>>('/notifications', { params: listParams(q) }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
  markRead: (id: number) => api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.post<{ detail: string }>('/notifications/read-all').then((r) => r.data),
}

export const NOTIFICATIONS_KEY = ['notifications'] as const

export function useNotifications(q: ListQuery = {}, enabled = true) {
  return useQuery({ queryKey: [...NOTIFICATIONS_KEY, 'list', q], queryFn: () => notificationsApi.list(q), enabled })
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    enabled,
    refetchInterval: 60_000,
    retry: false,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useReadAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}
