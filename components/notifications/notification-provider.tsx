'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePushNotifications, useForegroundMessages } from '@/hooks/use-push-notifications'
import { toast } from 'sonner'

interface Notification {
  id: number
  user_id: number
  title: string
  body: string
  icon: string | null
  link: string | null
  type: string
  data: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  pushPermission: NotificationPermission | 'default'
  isPushSupported: boolean
  requestPushPermission: () => Promise<void>
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}

export function NotificationProvider({
  children,
  userId,
}: {
  children: React.ReactNode
  userId?: string | number | null
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const { isSupported, permission, subscribe } = usePushNotifications(userId)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=50')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Auto-subscribe to push when user is logged in
  useEffect(() => {
    if (userId && isSupported && permission === 'granted') {
      subscribe()
    }
  }, [userId, isSupported, permission, subscribe])

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (!userId) return

    fetchNotifications()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId, fetchNotifications])

  // Handle foreground messages — show toast and update state
  useForegroundMessages(
    useCallback(
      (payload: any) => {
        const title = payload.notification?.title || payload.data?.title || 'Notifikasi'
        const body = payload.notification?.body || payload.data?.body || ''
        const link = payload.data?.link

        // Show toast notification
        toast(title, {
          description: body,
          action: link
            ? {
                label: 'Buka',
                onClick: () => {
                  window.location.href = link
                },
              }
            : undefined,
          duration: 8000,
        })

        // Refresh notifications
        fetchNotifications()
      },
      [fetchNotifications]
    )
  )

  // Request push permission
  const requestPushPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Browser kamu tidak support push notification (Wajib HTTPS atau localhost)')
      return
    }
    toast.loading('Menghubungkan notifikasi HP...', { id: 'push-register' })
    try {
      const token = await subscribe()
      if (token) {
        toast.success('Push notification berhasil diaktifkan untuk HP ini! 🔔', { id: 'push-register' })
      } else if (Notification.permission === 'denied') {
        toast.error('Push notification diblokir di browser. Buka pengaturan browser untuk mengizinkan.', { id: 'push-register' })
      } else {
        toast.error('Gagal mendaftarkan HP. Pastikan akses via HTTPS dan izin notifikasi aktif.', { id: 'push-register' })
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal mendaftarkan push'}`, { id: 'push-register' })
    }
  }, [isSupported, subscribe])

  // Mark single notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Mark as read failed:', err)
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Mark all as read failed:', err)
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        pushPermission: permission,
        isPushSupported: isSupported,
        requestPushPermission,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
