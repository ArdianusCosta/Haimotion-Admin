'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/firebase-client'

interface PushNotificationState {
  isSupported: boolean
  isSecureContext: boolean
  permission: NotificationPermission | 'default'
  token: string | null
  isLoading: boolean
}

export function usePushNotifications(userId?: number | string | null) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSecureContext: true,
    permission: 'default',
    token: null,
    isLoading: true,
  })
  const subscribed = useRef(false)

  // Check browser support
  useEffect(() => {
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false
    const hasAPIs =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setState((prev) => ({
      ...prev,
      isSecureContext: isSecure,
      isSupported: hasAPIs,
      permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
      isLoading: false,
    }))
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(
    async (force = false): Promise<string> => {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error('Akses dari HP wajib via HTTPS. Browser HP memblokir notifikasi di koneksi HTTP biasa.')
      }

      if (!state.isSupported) {
        throw new Error('Browser di perangkat ini tidak mendukung Web Push Notification.')
      }

      if (subscribed.current && state.token && !force) {
        return state.token
      }

      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const token = await requestNotificationPermission()

        // Save token to server
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            device: getDeviceInfo(),
            browser: getBrowserInfo(),
            userId,
          }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `Server status ${response.status}: Gagal menyimpan langganan`)
        }

        subscribed.current = true
        setState((prev) => ({
          ...prev,
          permission: 'granted',
          token,
          isLoading: false,
        }))

        return token
      } catch (error: any) {
        console.error('Push subscription error:', error)
        setState((prev) => ({ ...prev, isLoading: false }))
        throw error
      }
    },
    [state.isSupported, state.token, userId]
  )

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.token) return

    try {
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token }),
      })

      subscribed.current = false
      setState((prev) => ({ ...prev, token: null }))
    } catch (error) {
      console.error('Push unsubscribe error:', error)
    }
  }, [state.token])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}

// Helper: detect device type
function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac/i.test(ua)) return 'macOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'unknown'
}

// Helper: detect browser
function getBrowserInfo(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'Chrome'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
  if (/Edge/i.test(ua)) return 'Edge'
  return 'unknown'
}

// Hook to listen for foreground messages
export function useForegroundMessages(onMessage: (payload: any) => void) {
  useEffect(() => {
    onForegroundMessage(onMessage)
  }, [onMessage])
}
