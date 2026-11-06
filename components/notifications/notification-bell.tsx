'use client'

import { useRef, useEffect, useState } from 'react'
import { Bell, X, CheckCheck, ExternalLink, Loader2, ClipboardList, Pencil, MessageSquare, Tag, Calendar, Clock, Video, DollarSign, Lock, Smartphone } from 'lucide-react'
import { useNotifications } from './notification-provider'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function NotificationTypeIcon({ type }: { type: string }) {
  const iconProps = { className: "size-4 text-foreground/80" }
  switch (type) {
    case 'task_assigned':
      return <ClipboardList {...iconProps} className="size-4 text-blue-500" />
    case 'task_updated':
      return <Pencil {...iconProps} className="size-4 text-amber-500" />
    case 'task_comment':
    case 'chat_message':
      return <MessageSquare {...iconProps} className="size-4 text-sky-500" />
    case 'task_mention':
    case 'chat_mention':
      return <Tag {...iconProps} className="size-4 text-purple-500" />
    case 'calendar_event':
      return <Calendar {...iconProps} className="size-4 text-emerald-500" />
    case 'calendar_reminder':
      return <Clock {...iconProps} className="size-4 text-amber-500" />
    case 'meeting_invite':
      return <Video {...iconProps} className="size-4 text-rose-500" />
    case 'finance_approval':
      return <DollarSign {...iconProps} className="size-4 text-emerald-600" />
    default:
      return <Bell {...iconProps} className="size-4 text-muted-foreground" />
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    pushPermission,
    isPushSupported,
    isPushSubscribed,
    isSecureContext,
    requestPushPermission,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleNotifClick = async (notif: any) => {
    if (!notif.is_read) {
      await markAsRead(notif.id)
    }
    if (notif.link) {
      window.location.href = notif.link
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none cursor-pointer"
        aria-label="Notifications"
        id="notification-bell-btn"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2.5 w-[min(380px,calc(100vw-24px))] sm:w-[400px] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col max-h-[min(520px,calc(100vh-80px))] animate-in fade-in-0 zoom-in-95 duration-150"
          id="notification-dropdown"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 shrink-0 bg-card/95 backdrop-blur-sm select-none">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bell className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Notifikasi</h2>
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="size-3.5 text-primary" />
                  <span>Tandai semua</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Push Permission / Status Banner */}
          {isPushSupported && (
            <div className={`shrink-0 border-b border-border/60 px-4 py-2 flex items-center justify-between text-xs ${
              !isSecureContext
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : pushPermission === 'denied'
                ? 'bg-destructive/10 text-destructive'
                : isPushSubscribed
                ? 'bg-emerald-500/10 text-foreground'
                : 'bg-primary/5 text-foreground'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full shrink-0 ${
                  !isSecureContext
                    ? 'bg-amber-500'
                    : isPushSubscribed
                    ? 'bg-emerald-500'
                    : pushPermission === 'granted'
                    ? 'bg-amber-500 animate-pulse'
                    : pushPermission === 'denied'
                    ? 'bg-destructive'
                    : 'bg-amber-500'
                }`} />
                <span className="font-medium text-[11px] truncate flex items-center gap-1">
                  {!isSecureContext ? (
                    <>
                      <span>Web Push: Butuh HTTPS</span>
                      <Lock className="size-3 text-muted-foreground" />
                    </>
                  ) : isPushSubscribed ? (
                    <>
                      <span>Notifikasi HP: Terhubung</span>
                      <Smartphone className="size-3 text-emerald-500" />
                    </>
                  ) : pushPermission === 'granted' ? (
                    'Izin Aktif - Belum Terhubung'
                  ) : pushPermission === 'denied' ? (
                    'Notifikasi HP Diblokir'
                  ) : (
                    'Notifikasi HP Belum Aktif'
                  )}
                </span>
              </div>
              {pushPermission !== 'denied' && (
                <button
                  onClick={requestPushPermission}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                    !isSecureContext
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30'
                      : isPushSubscribed
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {!isSecureContext
                    ? 'Info'
                    : isPushSubscribed
                    ? 'Sinkron'
                    : pushPermission === 'granted'
                    ? 'Hubungkan'
                    : 'Aktifkan'}
                </button>
              )}
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border/40">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
                  <Bell className="size-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">Belum ada notifikasi</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Aktivitas penugasan tugas, pesan chat, dan jadwal meeting akan tampil di sini.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`
                      group relative flex items-start gap-3 p-3.5 text-left
                      transition-colors hover:bg-muted/60 cursor-pointer
                      ${!notif.is_read ? 'bg-primary/5' : ''}
                    `}
                    id={`notification-item-${notif.id}`}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-1.5 top-4 size-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    )}

                    {/* Icon */}
                    <div className="size-8 rounded-xl bg-muted/80 border border-border/40 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <NotificationTypeIcon type={notif.type} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs leading-snug truncate ${!notif.is_read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground/70 shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {notif.body}
                      </p>
                    </div>

                    {/* Link indicator */}
                    {notif.link && (
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="shrink-0 border-t border-border/80 px-4 py-2.5 bg-muted/20 text-center select-none">
              <p className="text-[11px] text-muted-foreground">
                Menampilkan {notifications.length} notifikasi terbaru
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
