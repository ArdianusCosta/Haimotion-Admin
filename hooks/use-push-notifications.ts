'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptionStatus,
  sendTestNotification,
} from '@/app/actions/notifications'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/firebase-client'
import { toast } from 'sonner'

// Helper to detect device & browser strings
function getDeviceInfo() {
  let device = 'Desktop'
  let browser = 'Browser'

  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent
    if (/Android/i.test(ua)) device = 'Android Phone'
    else if (/iPhone|iPad|iPod/.test(ua)) device = 'Apple iOS'
    else if (/Macintosh/.test(ua)) device = 'macOS Desktop'
    else if (/Windows/.test(ua)) device = 'Windows PC'

    if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome'
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
    else if (/Edg/.test(ua)) browser = 'Edge'
    else if (/Firefox/.test(ua)) browser = 'Firefox'
  }

  return { device, browser }
}

// ============================================================================
// TANSTACK QUERY HOOKS (Primary Modern Interface)
// ============================================================================

export function usePushNotificationStatus() {
  return useQuery({
    queryKey: ['push-notification', 'status'],
    queryFn: async () => {
      return await getPushSubscriptionStatus()
    },
    staleTime: 60000,
  })
}

export function useSubscribePush() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // 1. Request browser permission and obtain FCM token
      const token = await requestNotificationPermission()

      // 2. Identify device and browser info
      const { device, browser } = getDeviceInfo()

      // 3. Persist subscription token to database
      await savePushSubscription(token, device, browser)

      // Store locally for quick token unsubscription
      if (typeof window !== 'undefined') {
        localStorage.setItem('fcm_push_token', token)
      }

      return token
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notification', 'status'] })
      toast.success('Notifikasi perangkat berhasil diaktifkan!', {
        description: 'Anda akan menerima dering panggilan dan pesan saat web ditutup.',
      })
    },
    onError: (err: any) => {
      console.error('Subscribe push error:', err)
      toast.error('Gagal mengaktifkan notifikasi', {
        description: err?.message || 'Pastikan Anda memberikan izin notifikasi di browser.',
      })
    },
  })
}

export function useUnsubscribePush() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fcm_push_token') : null
      if (token) {
        await removePushSubscription(token)
        localStorage.removeItem('fcm_push_token')
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notification', 'status'] })
      toast.info('Notifikasi push pada perangkat ini telah dinonaktifkan.')
    },
    onError: (err: any) => {
      toast.error('Gagal menonaktifkan notifikasi', {
        description: err?.message,
      })
    },
  })
}

export function useSendTestPush() {
  return useMutation({
    mutationFn: async () => {
      return await sendTestNotification()
    },
    onSuccess: () => {
      toast.success('Notifikasi uji coba terkirim!', {
        description: 'Periksa status bar HP atau desktop laptop Anda sekarang.',
      })
    },
    onError: (err: any) => {
      toast.error('Gagal mengirim notifikasi uji coba', {
        description: err?.message,
      })
    },
  })
}

// ============================================================================
// PROVIDER COMPATIBILITY HOOKS (For NotificationProvider)
// ============================================================================

export function usePushNotifications(userId?: string | number | null) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSecureContext, setIsSecureContext] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'Notification' in window && 'serviceWorker' in navigator
      setIsSupported(supported)
      setIsSecureContext(window.isSecureContext)

      if ('Notification' in window) {
        setPermission(Notification.permission)
      }

      const savedToken = localStorage.getItem('fcm_push_token')
      if (savedToken) {
        setToken(savedToken)
      }
    }
  }, [])

  const subscribe = useCallback(async (showToast = true) => {
    const fcmToken = await requestNotificationPermission()
    const { device, browser } = getDeviceInfo()
    await savePushSubscription(fcmToken, device, browser)

    if (typeof window !== 'undefined') {
      localStorage.setItem('fcm_push_token', fcmToken)
      setToken(fcmToken)
      setPermission('granted')
    }

    if (showToast) {
      toast.success('Notifikasi perangkat aktif!', {
        description: 'Panggilan dan pesan akan masuk ke perangkat ini.',
      })
    }

    return fcmToken
  }, [])

  return {
    isSupported,
    isSecureContext,
    permission,
    token,
    subscribe,
  }
}

export function useForegroundMessages(callback: (payload: any) => void) {
  useEffect(() => {
    onForegroundMessage(callback)
  }, [callback])
}
