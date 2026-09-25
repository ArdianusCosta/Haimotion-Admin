'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { SecuritySettings } from './security-settings'
import { GeneralSettings } from './settings/general-settings'
import { AppearanceSettings } from './settings/appearance-settings'
import { SettingsSidebar } from './settings/settings-sidebar'

export function SettingsPage({ user }: { user?: any }) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('General')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('Workspace')}</span><span>/</span><span className="text-foreground">{t('Settings')}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('Settings')}</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1">
          {activeTab === 'General' && <GeneralSettings />}
          
          {activeTab === 'Appearance' && <AppearanceSettings />}

          {activeTab === 'Security' && <SecuritySettings />}

          {/* Placeholder for other tabs to show it's working */}
          {activeTab !== 'General' && activeTab !== 'Appearance' && activeTab !== 'Security' && (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
              <div className="rounded-full bg-muted p-4">
                <Settings2 className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">{activeTab} Settings</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                Configuration options for {activeTab.toLowerCase()} would appear here in the complete application.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Settings2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default SettingsPage
