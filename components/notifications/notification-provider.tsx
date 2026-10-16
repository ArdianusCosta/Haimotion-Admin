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
  isPushSubscribed: boolean
  isSecureContext: boolean
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

  const { isSupported, isSecureContext, permission, token, subscribe } = usePushNotifications(userId)

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

  // Auto-subscribe to push when user is logged in and permission is already granted
  useEffect(() => {
    if (userId && isSupported && isSecureContext && permission === 'granted') {
      subscribe(false).catch((err) => {
        console.warn('Auto push subscription skipped/failed:', err?.message)
      })
    }
  }, [userId, isSupported, isSecureContext, permission, subscribe])

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
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('Browser HP memblokir push notifikasi di HTTP biasa. Wajib akses via HTTPS atau Cloudflare Tunnel/Ngrok!', {
        id: 'push-register',
        duration: 8000,
      })
      return
    }

    if (!isSupported) {
      toast.error('Browser perangkat ini tidak mendukung Web Push Notification.', { id: 'push-register' })
      return
    }

    toast.loading('Menghubungkan notifikasi HP...', { id: 'push-register' })
    try {
      const pushToken = await subscribe(true)
      if (pushToken) {
        toast.success('Push notification berhasil diaktifkan untuk HP ini! 🔔', {
          id: 'push-register',
          duration: 5000,
        })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mendaftarkan push notifikasi.', {
        id: 'push-register',
        duration: 8000,
      })
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
        isPushSubscribed: !!token,
        isSecureContext,
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
