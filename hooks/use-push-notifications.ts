'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/firebase-client'

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission | 'default'
  token: string | null
  isLoading: boolean
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    token: null,
    isLoading: true,
  })
  const subscribed = useRef(false)

  // Check browser support
  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'default',
      isLoading: false,
    }))
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported || subscribed.current) return null

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const token = await requestNotificationPermission()
      if (!token) {
        setState((prev) => ({
          ...prev,
          permission: Notification.permission,
          isLoading: false,
        }))
        return null
      }

      // Save token to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          device: getDeviceInfo(),
          browser: getBrowserInfo(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      subscribed.current = true
      setState((prev) => ({
        ...prev,
        permission: 'granted',
        token,
        isLoading: false,
      }))

      return token
    } catch (error) {
      console.error('Push subscription error:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
      return null
    }
  }, [state.isSupported])

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
