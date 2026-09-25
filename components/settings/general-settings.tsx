'use client'

import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { useLanguage, TIMEZONES } from '@/components/language-provider'
import { toast } from 'sonner'

export function GeneralSettings() {
  const { language, setLanguage, timezone, setTimezone, t } = useLanguage()
  const [pendingLang, setPendingLang] = useState<'en' | 'id'>(language as 'en' | 'id')
  const [pendingTz, setPendingTz] = useState(timezone)

  const saveLocalization = () => {
    setLanguage(pendingLang)
    setTimezone(pendingTz)
    toast.success(t('Preferences saved'))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold">{t('Workspace Profile')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("This is your company's presence on HaiMotion.")}</p>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground">{t('Workspace Logo')}</label>
              <div className="flex size-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{t('JPG, GIF or PNG. Max size 2MB.')}</p>
            </div>
            <div className="flex-1 space-y-4 sm:ml-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('Workspace Name')}</label>
                <input defaultValue="HaiMotion Inc." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('Workspace URL')}</label>
                <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <span className="pl-3 text-sm text-muted-foreground">haimotion.app/</span>
                  <input defaultValue="acme-corp" className="w-full bg-transparent px-3 py-2 text-sm outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-border bg-muted/20 p-4">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t('Save changes')}</button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold">{t('Localization')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Manage your timezone and language preferences.')}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('Language')}</label>
              <select 
                value={pendingLang}
                onChange={(e) => setPendingLang(e.target.value as 'en' | 'id')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              >
                <option value="en">English (US)</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('Timezone')}</label>
              <select 
                value={pendingTz}
                onChange={(e) => setPendingTz(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-border bg-muted/20 p-4">
          <button 
            onClick={saveLocalization}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('Save preferences')}
          </button>
        </div>
      </div>
    </div>
  )
}
