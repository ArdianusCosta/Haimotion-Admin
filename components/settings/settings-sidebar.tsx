'use client'

import React from 'react'
import { Bell, Palette, Globe, Shield, CreditCard, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

type SettingsSidebarProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function SettingsSidebar({ activeTab, setActiveTab }: SettingsSidebarProps) {
  const { t } = useLanguage()

  const tabs = [
    { name: 'General', icon: Globe, description: t('Workspace details and timezone') },
    { name: 'Appearance', icon: Palette, description: t('Theme and UI preferences') },
    { name: 'Notifications', icon: Bell, description: t('Email and push alerts') },
    { name: 'Security', icon: Shield, description: t('2FA and active sessions') },
    { name: 'Billing', icon: CreditCard, description: t('Payment methods and plans') },
  ]

  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 md:w-64">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => setActiveTab(tab.name)}
          className={`flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
            activeTab === tab.name 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <tab.icon className={`size-5 shrink-0 ${activeTab === tab.name ? 'text-primary' : 'text-muted-foreground'}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${activeTab === tab.name ? 'text-primary' : 'text-foreground'}`}>{t(tab.name)}</p>
            <p className="mt-0.5 truncate text-[11px] opacity-80">{tab.description}</p>
          </div>
          <ChevronRight className={`size-4 opacity-50 ${activeTab === tab.name ? 'visible' : 'hidden md:visible'}`} />
        </button>
      ))}
    </aside>
  )
}
