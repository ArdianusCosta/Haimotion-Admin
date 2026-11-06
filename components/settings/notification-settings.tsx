'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Volume2, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { toast } from 'sonner'

export function NotificationSettings() {
  const { t } = useLanguage()

  const [settings, setSettings] = useState({
    emailTasks: true,
    emailMentions: true,
    emailReports: false,
    pushCalls: true,
    pushMessages: true,
    soundEnabled: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

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

  return (
    <div className="flex flex-col gap-6">
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
      </div>

      {/* Push & Browser Notifications */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Smartphone className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t('Pemberitahuan Langsung & Browser')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('Notifikasi pop-up dan suara real-time saat Anda sedang aktif di HaiMotion.')}
            </p>
          </div>
        </div>

        <div className="p-5 divide-y divide-border/60">
          <div className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{t('Panggilan & Video Rapat Masuk')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Tampilkan pop-up peringatan panggilan segera saat tim mengundang Anda ke ruang rapat.')}
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
              <p className="text-sm font-medium text-foreground">{t('Efek Suara Notifikasi')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Putar nada dering dan suara lembut ketika pemberitahuan baru diterima.')}
              </p>
            </div>
            <Switch 
              checked={settings.soundEnabled} 
              onCheckedChange={() => handleToggle('soundEnabled')} 
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

