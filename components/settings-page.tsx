'use client'

import { useState } from 'react'
import { Globe, Bell, Shield, Palette } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { SecuritySettings } from './security-settings'
import { GeneralSettings } from './settings/general-settings'
import { AppearanceSettings } from './settings/appearance-settings'
import { NotificationSettings } from './settings/notification-settings'

export function SettingsPage({ user }: { user?: any }) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'General' | 'Notifications' | 'Security' | 'Appearance'>('General')

  const tabs = [
    { id: 'General', label: 'General', icon: Globe },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Security', label: 'Security', icon: Shield },
    { id: 'Appearance', label: 'Appearance', icon: Palette },
  ] as const

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      {/* Page Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('Workspace')}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{t('Settings')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{t('Settings')}</h1>
        <p className="mt-1 text-xs sm:text-sm leading-6 text-muted-foreground">
          {t('Manage your workspace profile, preferences, notifications, and security.')}
        </p>
      </div>

      {/* Top Centered Tabs Navigation */}
      <div className="flex justify-center w-full">
        <div className="inline-flex items-center gap-1.5 p-1.5 bg-muted/50 rounded-2xl border border-border/60 max-w-full overflow-x-auto scrollbar-none shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{t(tab.label)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="w-full mt-2">
        {activeTab === 'General' && <GeneralSettings />}
        {activeTab === 'Notifications' && <NotificationSettings />}
        {activeTab === 'Security' && <SecuritySettings />}
        {activeTab === 'Appearance' && <AppearanceSettings />}
      </div>
    </div>
  )
}

export default SettingsPage
