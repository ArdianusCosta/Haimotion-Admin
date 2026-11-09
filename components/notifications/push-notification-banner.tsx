'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Smartphone, X, Loader2, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePushNotificationStatus, useSubscribePush } from '@/hooks/use-push-notifications'

export function PushNotificationBanner() {
  const [dismissed, setDismissed] = useState(true)
  const [isIOSWithoutPWA, setIsIOSWithoutPWA] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

  const { data: status, isLoading: isStatusLoading } = usePushNotificationStatus()
  const subscribePush = useSubscribePush()

  useEffect(() => {
    // Only run on browser
    if (typeof window === 'undefined') return

    // Check dismissed in session
    const isDismissed = sessionStorage.getItem('dismiss_push_banner') === 'true'

    if ('Notification' in window) {
      setPermissionState(Notification.permission)
      if (Notification.permission === 'granted') {
        setDismissed(true)
        return
      }
    }

    // Check iOS without standalone mode
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches

    if (isIOS && !isStandalone) {
      setIsIOSWithoutPWA(true)
    }

    setDismissed(isDismissed)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('dismiss_push_banner', 'true')
  }

  const handleEnable = () => {
    subscribePush.mutate(undefined, {
      onSuccess: () => {
        setDismissed(true)
        setPermissionState('granted')
      },
    })
  }

  // Don't render if already granted, dismissed, or loading
  if (dismissed || isStatusLoading || permissionState === 'granted') {
    return null
  }

  return (
    <div className="w-full mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <Card className="border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Aktifkan Notifikasi Panggilan Masuk di HP &amp; Laptop
                </h4>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  PWA &amp; Push
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Dapatkan notifikasi dan nada dering panggilan (Call &amp; VC) serta pesan baru secara langsung, bahkan saat browser sedang ditutup atau layar terkunci.
              </p>
              {isIOSWithoutPWA && (
                <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1 mt-1">
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Di iPhone/iPad: Buka di Safari, ketuk tombol Share lalu pilih &quot;Tambahkan ke Layar Utama&quot;.</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={subscribePush.isPending}
              className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {subscribePush.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengaktifkan...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Aktifkan Sekarang</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

