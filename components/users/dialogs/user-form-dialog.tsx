'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Eye, EyeOff, Users as UsersIcon } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { User, Role } from '@/types/user'
import { useSaveUser, useRoles } from '@/hooks/use-users'
import { toast } from 'sonner'

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const { t } = useLanguage()
  const { data: rolesData } = useRoles()
  const rolesList: Role[] = rolesData?.roles || []

  const [formData, setFormData] = useState({ 
    firstname: '', 
    lastname: '', 
    email: '', 
    notification_email: '', 
    role_id: '', 
    password: '', 
    avatar: '', 
    nik: '', 
    address: '' 
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const saveMutation = useSaveUser(user?.id, () => onOpenChange(false))

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname,
        lastname: user.lastname || '',
        email: user.email,
        notification_email: user.notification_email || '',
        role_id: user.role_id ? String(user.role_id) : '',
        password: '',
        avatar: user.avatar || '',
        nik: user.nik || '',
        address: user.address || ''
      })
    } else {
      setFormData({ 
        firstname: '', lastname: '', email: '', notification_email: '', 
        role_id: '', password: '', avatar: '', nik: '', address: '' 
      })
    }
  }, [user, open])

  if (!open) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    const form = new FormData()
    form.append('file', file)
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await res.json()
      if (res.ok) {
        setFormData(prev => ({ ...prev, avatar: uploadData.url }))
        toast.success(t("Avatar uploaded successfully!"))
      } else {
        toast.error(t("Avatar upload failed!"))
      }
    } catch (error) {
      console.error(error)
      toast.error(t("Error uploading avatar file"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { ...formData }
    if (user && !payload.password) delete payload.password // Don't send empty password on update
    saveMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-0">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{user ? t('Edit User') : t('Add New User')}</h2>
          <button onClick={() => onOpenChange(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('First Name')} <span className="text-destructive">*</span></label>
              <input required value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('Last Name')}</label>
              <input value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('Email')} <span className="text-destructive">*</span></label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('Notification Email')}</label>
              <input type="email" value={formData.notification_email} onChange={e => setFormData({...formData, notification_email: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('NIK')}</label>
              <input value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium">{t('Avatar')}</label>
              <div className="flex items-center gap-4 mt-1">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted/50 shadow-inner">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <UsersIcon className="size-6 opacity-50" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      title="Click to upload"
                    />
                    <button type="button" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted hover:text-foreground">
                      {t('Choose File')}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate w-[150px]">
                    {!isUploading && formData.avatar ? formData.avatar.split('/').pop() : t('JPG, PNG, GIF up to 5MB')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('Address')}</label>
            <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
          </div>
          

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('Password')} {user && <span className="text-xs text-muted-foreground font-normal">{t('(Leave empty to keep current)')}</span>}</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required={!user} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={user ? '••••••••' : t('Password...')} className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('Role')}</label>
            <select value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50">
              <option value="">{t('-- Pilih Role --')}</option>
              {rolesList.map(role => (
                <option key={role.id} value={role.id.toString()}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">{t('Cancel')}</button>
            <button type="submit" disabled={saveMutation.isPending || isUploading} className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {(saveMutation.isPending || isUploading) && <Loader2 className="mr-2 size-4 animate-spin" />}
              {user ? t('Save Changes') : t('Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
