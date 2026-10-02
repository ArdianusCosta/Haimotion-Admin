'use client'

import React, { useState, useEffect } from 'react'
import { Upload, Loader2, Image as ImageIcon, Check } from 'lucide-react'
import { useLanguage, TIMEZONES } from '@/components/language-provider'
import { AvatarCropperModal } from '@/components/avatar-cropper-modal'
import { toast } from 'sonner'

export function GeneralSettings() {
  const { language, setLanguage, timezone, setTimezone, t } = useLanguage()
  
  // Workspace Profile State
  const [workspaceName, setWorkspaceName] = useState('HaiMotion Inc.')
  const [workspaceUrl, setWorkspaceUrl] = useState('acme-corp')
  const [workspaceLogo, setWorkspaceLogo] = useState('/logohm-transparent.png')
  const [isUploading, setIsUploading] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  // Localization State
  const [pendingLang, setPendingLang] = useState<'en' | 'id'>(language as 'en' | 'id')
  const [pendingTz, setPendingTz] = useState(timezone)

  // Load stored workspace profile on mount
  useEffect(() => {
    const stored = localStorage.getItem('workspace_profile')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.name) setWorkspaceName(parsed.name)
        if (parsed.url) setWorkspaceUrl(parsed.url)
        if (parsed.logo) setWorkspaceLogo(parsed.logo)
      } catch (e) {}
    }
  }, [])

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', croppedBlob, 'workspace-logo.png')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setWorkspaceLogo(data.url)
        
        // Auto-save & broadcast workspace profile change
        const stored = localStorage.getItem('workspace_profile')
        const current = stored ? JSON.parse(stored) : {}
        const updated = { ...current, name: workspaceName, url: workspaceUrl, logo: data.url }
        localStorage.setItem('workspace_profile', JSON.stringify(updated))
        window.dispatchEvent(new Event('workspace-profile-updated'))
        
        toast.success(t('Logo workspace berhasil dipotong dan diperbarui!'))
        setCropImageSrc(null)
      } else {
        toast.error(t('Gagal mengunggah logo.'))
      }
    } catch {
      toast.error(t('Terjadi kesalahan saat mengunggah logo.'))
    } finally {
      setIsUploading(false)
    }
  }

  const saveWorkspaceProfile = () => {
    const profile = {
      name: workspaceName,
      url: workspaceUrl,
      logo: workspaceLogo
    }
    localStorage.setItem('workspace_profile', JSON.stringify(profile))
    
    // Broadcast custom event so Dashboard Sidebar and Login page update reactively!
    window.dispatchEvent(new Event('workspace-profile-updated'))
    
    toast.success(t('Profil workspace berhasil disimpan!'))
  }

  const saveLocalization = () => {
    setLanguage(pendingLang)
    setTimezone(pendingTz)
    toast.success(t('Preferences saved'))
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* ─── Workspace Profile Card ─── */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold">{t('Workspace Profile')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("This is your company's presence on HaiMotion.")}</p>
        </div>
        
        <div className="p-5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            
            {/* Logo Upload Box */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground">{t('Workspace Logo')}</label>
              <div className="relative group flex size-28 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden transition-all hover:border-primary/50">
                {workspaceLogo ? (
                  <img src={workspaceLogo} alt="Workspace Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <Upload className="size-6 text-muted-foreground" />
                )}
                
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer transition-opacity">
                  <input type="file" accept="image/*" onChange={handleLogoSelect} className="sr-only" />
                  {isUploading ? (
                    <Loader2 className="size-5 animate-spin mb-1" />
                  ) : (
                    <>
                      <ImageIcon className="size-5 mb-1" />
                      <span>{t('Ubah Logo')}</span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">{t('JPG, GIF or PNG. Max size 2MB.')}</p>
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-4 sm:ml-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('Workspace Name')}</label>
                <input 
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="HaiMotion Inc." 
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('Workspace URL')}</label>
                <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <span className="pl-3 text-sm text-muted-foreground shrink-0">haimotion.app/</span>
                  <input 
                    value={workspaceUrl}
                    onChange={(e) => setWorkspaceUrl(e.target.value)}
                    placeholder="acme-corp" 
                    className="w-full bg-transparent px-3 py-2 text-sm outline-none" 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border bg-muted/20 p-4">
          <button 
            onClick={saveWorkspaceProfile}
            disabled={isUploading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60"
          >
            {t('Save changes')}
          </button>
        </div>
      </div>

      {/* ─── Localization Card ─── */}
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
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            {t('Save preferences')}
          </button>
        </div>
      </div>

      {/* ─── Avatar/Logo Cropper Modal ─── */}
      {cropImageSrc && (
        <AvatarCropperModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
          isUploading={isUploading}
        />
      )}
    </div>
  )
}
