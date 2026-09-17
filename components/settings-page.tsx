'use client'

import { useState } from 'react'
import { User, Bell, Palette, Globe, Shield, CreditCard, Upload, Check, ChevronRight } from 'lucide-react'
import { useLanguage, TIMEZONES } from '@/components/language-provider'
import { SecuritySettings } from './security-settings'
import { toast } from 'sonner'

export function SettingsPage({ user }: { user?: any }) {
  const { language, setLanguage, timezone, setTimezone, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('General')
  // Local pending state for localization (committed only when Save is clicked)
  const [pendingLang, setPendingLang] = useState<'en' | 'id'>(language as 'en' | 'id')
  const [pendingTz, setPendingTz] = useState(timezone)

  const saveLocalization = () => {
    setLanguage(pendingLang)
    setTimezone(pendingTz)
    toast.success(t('Preferences saved'))
  }

  const tabs = [
    { name: 'General', icon: Globe, description: t('Workspace details and timezone') },
    { name: 'Appearance', icon: Palette, description: t('Theme and UI preferences') },
    { name: 'Notifications', icon: Bell, description: t('Email and push alerts') },
    { name: 'Security', icon: Shield, description: t('2FA and active sessions') },
    { name: 'Billing', icon: CreditCard, description: t('Payment methods and plans') },
  ]

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
        {/* Settings Sidebar */}
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

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'General' && (
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
          )}

          {activeTab === 'Appearance' && (
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
          )}

          {/* Security Tab */}
          {activeTab === 'Security' && (
            <SecuritySettings />
          )}

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
