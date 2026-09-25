'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Users as UsersIcon, Eye, EyeOff, Camera, CheckCircle2, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/components/language-provider'
import dynamic from 'next/dynamic'

const FaceScanner = dynamic(() => import('@/components/face-scanner').then(mod => mod.FaceScanner), { ssr: false })

function FieldGroup({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Divider({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-border" />
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="text-xs text-muted-foreground mb-5">{subtitle}</p>
    </div>
  )
}

export function AccountSettings({ user }: { user?: any }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    firstname: user?.firstname || '',
    nik: user?.nik || '',
    address: user?.address || '',
    email: user?.email || '',
    notification_email: user?.notification_email || '',
    password: '',
    confirmPassword: '',
    avatar: user?.avatar || ''
  })

  const [isUploading, setIsUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false)
  const [isFaceProcessing, setIsFaceProcessing] = useState(false)

  const handleFaceDetected = async (descriptor: Float32Array) => {
    setIsFaceProcessing(true)
    try {
      const res = await fetch(`/api/users/${user.id}/face`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceDescriptor: Array.from(descriptor) })
      })
      if (res.ok) {
        toast.success(t('Face registered successfully!'))
        setIsFaceScannerOpen(false)
      } else {
        toast.error(t('Failed to register face.'))
      }
    } catch (e) {
      toast.error(t('Error connecting to server.'))
    } finally {
      setIsFaceProcessing(false)
    }
  }

  const handleRegisterPasskey = async () => {
    setIsPasskeyLoading(true)
    try {
      const { data, error } = await authClient.passkey.addPasskey()
      if (error) {
        toast.error(error.message || t('Failed to register passkey'))
      } else {
        toast.success(t('Device registered successfully for Passkey login!'))
      }
    } catch (err) {
      toast.error(t('An error occurred during passkey registration'))
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  const roleName = user?.role?.name || (user?.type === 1 ? 'Super Admin' : 'Admin')
  const position = user?.name || ''

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
        toast.success('Avatar uploaded successfully!')
      } else {
        toast.error('Failed to upload avatar!')
      }
    } catch {
      toast.error('An error occurred while uploading avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!user?.id) throw new Error('User ID tidak ditemukan')
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success(t('Profile saved successfully!'))
      setTimeout(() => window.location.reload(), 1500)
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(t('Passwords do not match!'))
      return
    }
    const payload: any = {
      firstname: formData.firstname,
      nik: formData.nik,
      address: formData.address,
      email: formData.email,
      notification_email: formData.notification_email || null,
      avatar: formData.avatar
    }
    if (formData.password) payload.password = formData.password
    updateMutation.mutate(payload)
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-lg font-semibold">{t('Account Settings')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Manage your personal information, security, and profile picture.')}</p>
      </div>

      <form id="account-form" onSubmit={handleSubmit}>
        <div className="px-6 py-6 space-y-6">

          {/* ─── Informasi Dasar ─── */}
          <Divider title={t('Basic Information')} subtitle={t('Your name, staff code, and a short bio.')} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label={t('First Name')} required>
              <Input
                id="firstname"
                required
                value={formData.firstname}
                onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                placeholder="....."
              />
            </FieldGroup>

            <FieldGroup label={t('Position / Title')} hint={t('Managed by admin')}>
              <Input
                value={position}
                readOnly
                placeholder="....."
                className="cursor-not-allowed opacity-60 bg-muted/30"
              />
            </FieldGroup>

            <div className="sm:col-span-2">
              <FieldGroup label={t('Staff Code')}>
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={e => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="....."
                />
              </FieldGroup>
            </div>

            {/* Empty col to keep bio on its own row visually OR span 2 */}
            <div className="sm:col-span-2">
              <FieldGroup label={t('Bio')}>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('Tell us a little about yourself...')}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none custom-scrollbar"
                />
              </FieldGroup>
            </div>
          </div>

          {/* ─── Akun & Keamanan ─── */}
          <Divider title={t('Account & Security')} subtitle={t('Role, login email, and account password.')} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label={t('User Role')} hint={t('Role is managed by admin')}>
              <div className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm cursor-not-allowed">
                <span className="flex size-2 rounded-full bg-primary shrink-0" />
                <span className="font-medium">{roleName}</span>
              </div>
            </FieldGroup>

            {/* Spacer to keep role alone on its row */}
            <div className="hidden sm:block" />

            <FieldGroup label={t('Email Login')} required>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="users@haimotion.com"
              />
            </FieldGroup>

            <FieldGroup label={t('Notification Email')} hint={t('Optional — for Gmail notifications')}>
              <Input
                id="notification_email"
                type="email"
                value={formData.notification_email}
                onChange={e => setFormData({ ...formData, notification_email: e.target.value })}
                placeholder="users.haimotion@gmail.com"
              />
            </FieldGroup>

            <FieldGroup label={t('Password')} hint={t("Leave blank if you don't want to change your password")}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FieldGroup>

            <FieldGroup label={t('Confirm Password')}>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`pr-10 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[11px] text-destructive mt-1">{t('Passwords do not match')}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                <p className="text-[11px] text-green-500 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="size-3" /> {t('Passwords match')}
                </p>
              )}
            </FieldGroup>
          </div>

          {/* ─── Passkey / Face ID ─── */}
          <Divider title={t('Biometric Login')} subtitle={t('Login securely using your device biometrics or AI Camera.')} />
          
          <div className="flex flex-col gap-4 items-start">
            <p className="text-sm text-muted-foreground">{t('Register this device to allow logging in without a password.')}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleRegisterPasskey} disabled={isPasskeyLoading}>
                {isPasskeyLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Fingerprint className="mr-2 size-4" />}
                {isPasskeyLoading ? t('Registering...') : t('Register Sidik Jari / Device')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsFaceScannerOpen(true)}>
                <Camera className="mr-2 size-4" />
                {t('Register AI Face (Camera)')}
              </Button>
            </div>
          </div>

          {/* ─── Foto Profil ─── */}
          <Divider title={t('Profile Picture')} subtitle={t('Upload and adjust your avatar photo.')} />

          <div className="flex flex-col items-center gap-5">
            {/* Avatar Preview */}
            <div className="relative shrink-0">
              <div className="size-28 overflow-hidden rounded-full border-2 border-border bg-muted/50 shadow-sm">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UsersIcon className="size-12 text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>
              {/* Hover overlay */}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                {isUploading
                  ? <Loader2 className="size-5 animate-spin text-white" />
                  : <Camera className="size-5 text-white" />
                }
              </label>
            </div>

            {/* Upload controls */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <Button type="button" variant="outline" size="sm" disabled={isUploading}>
                    {isUploading
                      ? <><Loader2 className="size-3 animate-spin mr-1.5" />{t('Uploading...')}</>
                      : t('Upload new photo')
                    }
                  </Button>
                </div>
                {formData.avatar && (
                  <Button type="button" variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setFormData(p => ({ ...p, avatar: '' }))}>
                    {t('Remove')}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('JPG, GIF or PNG. Max 5MB. Hover the photo to upload directly.')}
              </p>
            </div>
          </div>

        </div>

        {/* ─── Footer ─── */}
        <div className="flex items-center justify-between border-t border-border bg-muted/10 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {t('Fields marked with')} <span className="text-destructive font-semibold">*</span> {t('are required.')}
          </p>
          <Button type="submit" disabled={updateMutation.isPending || isUploading} className="min-w-32">
            {updateMutation.isPending
              ? <><Loader2 className="mr-2 size-4 animate-spin" />{t('Saving...')}</>
              : t('Save Changes')
            }
          </Button>
        </div>
      </form>

      {isFaceScannerOpen && (
        <FaceScanner
          onCancel={() => setIsFaceScannerOpen(false)}
          onFaceDetected={handleFaceDetected}
          isProcessing={isFaceProcessing}
        />
      )}
    </div>
  )
}
