'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Phone,
  Video,
  Mail,
  Copy,
  Check,
  Calendar,
  Shield,
  MapPin,
  CreditCard,
  FileText,
  Download,
  ExternalLink,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserX,
  Loader2,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { cleanUserName } from '@/lib/utils'
import { getUserChatProfile } from '@/app/actions/chat'

interface UserProfileSheetProps {
  userId: number | null
  threadId?: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isOnline?: boolean
  onStartCall?: (type: 'voice' | 'video') => void
  onFocusChat?: () => void
}

export function UserProfileSheet({
  userId,
  threadId,
  open,
  onOpenChange,
  isOnline = false,
  onStartCall,
  onFocusChat,
}: UserProfileSheetProps) {
  const { t, formatDate } = useLanguage()
  const [profileData, setProfileData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'files'>('info')

  useEffect(() => {
    if (open && userId) {
      setIsLoading(true)
      getUserChatProfile(userId, threadId || undefined)
        .then((data) => {
          setProfileData(data)
        })
        .catch((err) => {
          console.error(err)
          toast.error(t('Failed to load user profile'))
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else if (!open) {
      setProfileData(null)
    }
  }, [open, userId, threadId, t])

  const user = profileData?.user
  const sharedFiles = profileData?.sharedFiles || []

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setHasCopied(true)
    toast.success(t('Email copied to clipboard'))
    setTimeout(() => setHasCopied(false), 2000)
  }

  const fullName = user
    ? `${cleanUserName(user.firstname)} ${cleanUserName(user.lastname)}`.trim()
    : ''
  const roleName = user?.role?.name || 'Team Member'
  const isResigned = user?.status === 'resign'

  const initials = user
    ? `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase() || 'U'
    : 'U'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 overflow-y-auto overflow-x-hidden border-l border-border bg-card shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{fullName || t('User Profile')}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">{t('Loading profile...')}</p>
          </div>
        ) : user ? (
          <div className="flex flex-col">
            {/* COVER BANNER & AVATAR */}
            <div className="relative">
              {/* Aesthetic gradient banner */}
              <div className="h-32 w-full bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-[circle_at_top] from-primary/10 via-transparent to-transparent" />
                <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-60">
                  <Sparkles className="size-4 text-primary" />
                </div>
              </div>

              {/* Avatar overlapping banner */}
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <Avatar className="size-24 border-4 border-card bg-muted shadow-lg ring-1 ring-border">
                    <AvatarImage src={user.avatar || ''} alt={fullName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Presence indicator */}
                  <span
                    className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-card ${
                      isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                    }`}
                    title={isOnline ? 'Online' : 'Offline'}
                  />
                </div>
              </div>
            </div>

            {/* IDENTITY HEADER */}
            <div className="pt-14 px-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                    {fullName}
                  </h2>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Shield className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">{roleName}</span>
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-medium px-2 py-0.5 border ${
                      isResigned
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isResigned ? (
                      <span className="flex items-center gap-1">
                        <UserX className="size-3" />
                        {t('Resign')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserCheck className="size-3" />
                        {t('Active')}
                      </span>
                    )}
                  </Badge>

                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span
                      className={`size-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/60'
                      }`}
                    />
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    if (onFocusChat) onFocusChat()
                  }}
                  className="flex items-center gap-1.5 h-9 bg-background/50 hover:bg-muted"
                >
                  <MessageSquare className="size-3.5 text-primary" />
                  <span className="text-xs">{t('Message')}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onStartCall) onStartCall('voice')
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-1.5 h-9 bg-background/50 hover:bg-muted"
                >
                  <Phone className="size-3.5 text-emerald-500" />
                  <span className="text-xs">{t('Call')}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onStartCall) onStartCall('video')
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-1.5 h-9 bg-background/50 hover:bg-muted"
                >
                  <Video className="size-3.5 text-blue-500" />
                  <span className="text-xs">{t('Video')}</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-border px-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors mr-6 ${
                  activeTab === 'info'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('Profile Info')}
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'files'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('Shared Files')}
                {sharedFiles.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">
                    {sharedFiles.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENT: PROFILE INFO */}
            {activeTab === 'info' && (
              <div className="p-6 space-y-5">
                {/* Email Section */}
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {t('Email Address')}
                    </span>
                    <button
                      onClick={() => handleCopyEmail(user.email)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title={t('Copy Email')}
                    >
                      {hasCopied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground break-all">{user.email}</p>
                </div>

                {/* Notification Email if exists */}
                {user.notification_email && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {t('Notification Email')}
                    </span>
                    <p className="text-sm font-semibold text-foreground break-all">
                      {user.notification_email}
                    </p>
                  </div>
                )}

                {/* Additional Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Joined Date */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {t('Joined Date')}
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      {user.date_created
                        ? formatDate(user.date_created)
                        : '-'}
                    </p>
                  </div>

                  {/* NIK */}
                  <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="size-3.5" />
                      {t('NIK')}
                    </span>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {user.nik || '-'}
                    </p>
                  </div>
                </div>

                {/* Address if exists */}
                {user.address && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {t('Address')}
                    </span>
                    <p className="text-xs font-medium text-foreground whitespace-pre-line leading-relaxed">
                      {user.address}
                    </p>
                  </div>
                )}

                {/* System Footer */}
                <div className="pt-2 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    HaiMotion System ERP
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SHARED FILES */}
            {activeTab === 'files' && (
              <div className="p-6">
                {sharedFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <FileText className="size-10 stroke-[1.5] mb-2 opacity-40" />
                    <p className="text-sm font-medium">{t('No shared files yet')}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 max-w-[220px]">
                      {t('Files and media sent in this conversation will appear here.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sharedFiles.map((file: any) => {
                      const isImage = /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(file.attachment)
                      const fileName = file.attachment.split('/').pop() || 'Attachment'

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isImage ? (
                              <img
                                src={file.attachment}
                                alt={fileName}
                                className="size-10 rounded-lg object-cover border border-border shrink-0 bg-background"
                              />
                            ) : (
                              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                <FileText className="size-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                                {fileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="size-3" />
                                {new Date(file.created_at).toLocaleDateString([], {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </p>
                            </div>
                          </div>

                          <a
                            href={file.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                            title={t('Download / Open')}
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('User not found')}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
