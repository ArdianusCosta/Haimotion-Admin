'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export function AppearanceSettings() {
  const { t } = useLanguage()

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold">{t('Theme Preferences')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Customize the look and feel of your dashboard.')}</p>
      </div>
      <div className="p-5 space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-medium">{t('Interface Theme')}</h3>
          <div className="grid grid-cols-3 gap-4">
            {['Light', 'Dark', 'System'].map((theme, i) => (
              <button key={theme} className="flex flex-col items-center gap-3">
                <div className={`aspect-video w-full rounded-lg border-2 p-1 ${i === 1 ? 'border-primary' : 'border-border'}`}>
                  <div className={`h-full w-full rounded-md ${theme === 'Dark' ? 'bg-zinc-900' : theme === 'Light' ? 'bg-zinc-100' : 'bg-gradient-to-br from-zinc-100 to-zinc-900'}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{t(theme)}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="mb-3 text-sm font-medium">{t('Accent Color')}</h3>
          <div className="flex flex-wrap gap-3">
            {['bg-blue-500', 'bg-violet-500', 'bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-zinc-900'].map((color, i) => (
              <button key={color} className={`flex size-10 items-center justify-center rounded-full ${color}`}>
                {i === 1 && <Check className="size-5 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
