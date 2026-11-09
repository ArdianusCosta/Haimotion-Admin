'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Volume2, Check, Send, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import {
  usePushNotificationStatus,
  useSubscribePush,
  useUnsubscribePush,
  useSendTestPush
} from '@/hooks/use-push-notifications'
import { toast } from 'sonner'

export function NotificationSettings() {
  const { t } = useLanguage()

  const { data: pushStatus, isLoading: isPushStatusLoading } = usePushNotificationStatus()
  const subscribePush = useSubscribePush()
  const unsubscribePush = useUnsubscribePush()
  const sendTestPush = useSendTestPush()

  const [hasLocalToken, setHasLocalToken] = useState(false)
  const [permission, setPermission] = useState<string>('default')

  const [settings, setSettings] = useState({
    emailTasks: true,
    emailMentions: true,
    emailReports: false,
    pushCalls: true,
    pushMessages: true,
    soundEnabled: true,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_preferences')
      if (saved) {
        try {
          setSettings(JSON.parse(saved))
        } catch (e) {}
      }

      if ('Notification' in window) {
        setPermission(Notification.permission)
      }

      const token = localStorage.getItem('fcm_push_token')
      setHasLocalToken(!!token)
    }
  }, [pushStatus])

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('notification_preferences', JSON.stringify(next))
      return next
    })
  }

  const handleSave = () => {
    localStorage.setItem('notification_preferences', JSON.stringify(settings))
    toast.success(t('Pengaturan notifikasi berhasil disimpan!'))
  }

  const handleTogglePushDevice = () => {
    if (hasLocalToken && permission === 'granted') {
      unsubscribePush.mutate(undefined, {
        onSuccess: () => setHasLocalToken(false)
      })
    } else {
      subscribePush.mutate(undefined, {
        onSuccess: () => {
          setHasLocalToken(true)
          if (typeof window !== 'undefined') {
            setPermission(Notification.permission)
          }
        }
      })
    }
  }

  const isDeviceActive = hasLocalToken && permission === 'granted'

  return (
    <div className="flex flex-col gap-6">
      {/* Push & Background Notifications (PWA) */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Smartphone className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{t('Push Notifikasi Perangkat (PWA &amp; Background)')}</h2>
                {isDeviceActive ? (
                  <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Aktif di Perangkat Ini
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                    <ShieldAlert className="size-3 text-amber-500" />
                    Belum Terhubung
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('Memungkinkan HP dan laptop Anda berdering saat ada panggilan Call &amp; VC meskipun website sedang ditutup.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {isDeviceActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendTestPush.mutate()}
                disabled={sendTestPush.isPending}
                className="h-8 text-xs gap-1.5 border-border"
              >
                {sendTestPush.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Send className="size-3" />
                )}
                <span>Uji Coba Notifikasi</span>
              </Button>
            )}

            <Button
              size="sm"
              variant={isDeviceActive ? 'outline' : 'default'}
              onClick={handleTogglePushDevice}
              disabled={subscribePush.isPending || unsubscribePush.isPending}
              className={`h-8 text-xs font-semibold gap-1.5 ${
                !isDeviceActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-border text-foreground'
              }`}
            >
              {subscribePush.isPending || unsubscribePush.isPending ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : isDeviceActive ? (
                <span>Nonaktifkan Perangkat Ini</span>
              ) : (
                <>
                  <Bell className="size-3" />
                  <span>Hubungkan Perangkat Ini</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="p-5 divide-y divide-border/60">
          <div className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Panggilan & Video Rapat Masuk')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Tampilkan pop-up peringatan panggilan segera saat tim mengundang Anda ke ruang rapat atau memanggil Anda di Messenger.')}
              </p>
            </div>
            <Switch 
              checked={settings.pushCalls} 
              onCheckedChange={() => handleToggle('pushCalls')} 
            />
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Pesan Obrolan Langsung (Messenger)')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Pemberitahuan saat ada chat pribadi atau pesan grup tim baru.')}
              </p>
            </div>
            <Switch 
              checked={settings.pushMessages} 
              onCheckedChange={() => handleToggle('pushMessages')} 
            />
          </div>

          <div className="py-3.5 last:pb-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Efek Suara & Dering Panggilan')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Putar nada dering dan getaran saat ada panggilan atau pesan masuk.')}
              </p>
            </div>
            <Switch 
              checked={settings.soundEnabled} 
              onCheckedChange={() => handleToggle('soundEnabled')} 
            />
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t('Notifikasi Email')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('Atur pembaruan dan laporan penting yang dikirimkan ke alamat email Anda.')}
            </p>
          </div>
        </div>

        <div className="p-5 divide-y divide-border/60">
          <div className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Tugas & Perubahan Proyek')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Terima pemberitahuan saat Anda ditugaskan ke tugas baru atau saat status proyek berubah.')}
              </p>
            </div>
            <Switch 
              checked={settings.emailTasks} 
              onCheckedChange={() => handleToggle('emailTasks')} 
            />
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Sebutan & Komentar (@mention)')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Dapatkan email saat rekan kerja menyebut Anda dalam komentar tugas atau diskusi.')}
              </p>
            </div>
            <Switch 
              checked={settings.emailMentions} 
              onCheckedChange={() => handleToggle('emailMentions')} 
            />
          </div>

          <div className="py-3.5 last:pb-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Laporan Ringkasan Mingguan')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Kirimkan rekap kemajuan proyek, deadline mendatang, dan KPI tim setiap pekan.')}
              </p>
            </div>
            <Switch 
              checked={settings.emailReports} 
              onCheckedChange={() => handleToggle('emailReports')} 
            />
          </div>
        </div>

        <div className="border-t border-border p-5 flex justify-end">
          <Button onClick={handleSave} className="gap-2 h-9 px-5 rounded-lg text-xs font-semibold">
            <Check className="size-3.5" />
            <span>{t('Simpan Pengaturan')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
