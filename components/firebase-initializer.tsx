'use client'

import { useEffect, useRef } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/firebase-client'
import { toast } from 'sonner'

/**
 * FirebaseInitializer
 * Mount this once inside the authenticated layout.
 * It will:
 *  1. Request browser notification permission
 *  2. Get the FCM token and save it to the DB (POST /api/notifications/subscribe)
 *  3. Listen for foreground messages and show them as toasts
 */
export function FirebaseInitializer() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      try {
        // 1. Request permission & get FCM token
        const token = await requestNotificationPermission()
        if (!token) return

        // 2. Save token to DB
        const device = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
        const browser = getBrowserName()

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, device, browser }),
        })

        console.log('[FCM] Token registered successfully')
      } catch (err) {
        // Silently ignore — notification is optional
        console.warn('[FCM] Init failed:', err)
      }
    }

    init()

    // 3. Foreground message listener (when the tab is active)
    onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? 'HaiMotion'
      const body = payload.notification?.body ?? payload.data?.body ?? ''
      const link = payload.data?.link ?? payload.fcmOptions?.link

      toast(title, {
        description: body,
        duration: 6000,
        action: link
          ? {
              label: 'Buka',
              onClick: () => window.open(link, '_self'),
            }
          : undefined,
      })
    })
  }, [])

  return null
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  return 'Unknown'
}
