'use client'

import { useRef, useEffect, useState } from 'react'
import { Bell, X, CheckCheck, Settings, ExternalLink, Loader2 } from 'lucide-react'
import { useNotifications } from './notification-provider'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const TYPE_ICONS: Record<string, string> = {
  task_assigned: '📋',
  task_updated: '✏️',
  task_comment: '💬',
  task_mention: '🔔',
  chat_message: '💬',
  chat_mention: '🏷️',
  calendar_event: '📅',
  calendar_reminder: '⏰',
  meeting_invite: '🎥',
  finance_approval: '💰',
  general: '🔔',
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
        className="relative rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notifications"
        id="notification-bell-btn"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[380px] rounded-xl border border-border bg-card shadow-xl"
          style={{ maxHeight: '520px', display: 'flex', flexDirection: 'column' }}
          id="notification-dropdown"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Notifikasi</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="size-3" />
                  Tandai semua
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Push Permission / Status Banner */}
          {isPushSupported && (
            <div className={`border-b border-border px-4 py-2.5 flex items-center justify-between text-xs ${
              !isSecureContext
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : pushPermission === 'denied'
                ? 'bg-destructive/10 text-destructive'
                : isPushSubscribed
                ? 'bg-emerald-500/10 text-foreground'
                : 'bg-primary/5 text-foreground'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${
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
                <span className="font-medium text-xs">
                  {!isSecureContext
                    ? 'Web Push: Butuh HTTPS 🔒'
                    : isPushSubscribed
                    ? 'Notifikasi HP: Terhubung 📱🔔'
                    : pushPermission === 'granted'
                    ? 'Izin Aktif - Belum Terhubung'
                    : pushPermission === 'denied'
                    ? 'Notifikasi HP Diblokir'
                    : 'Notifikasi HP Belum Aktif'}
                </span>
              </div>
              {pushPermission !== 'denied' && (
                <button
                  onClick={requestPushPermission}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    !isSecureContext
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30'
                      : isPushSubscribed
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {!isSecureContext
                    ? 'Info HTTPS'
                    : isPushSubscribed
                    ? 'Sinkron Ulang'
                    : pushPermission === 'granted'
                    ? 'Hubungkan HP'
                    : 'Aktifkan'}
                </button>
              )}
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Belum ada notifikasi</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Notifikasi baru akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif, idx) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`
                      group relative flex items-start gap-3 border-b border-border/50 px-4 py-3 text-left
                      transition-colors hover:bg-muted/50 last:border-0
                      ${!notif.is_read ? 'bg-primary/3' : ''}
                    `}
                    id={`notification-item-${notif.id}`}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-2 top-4 size-1.5 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <span className="mt-0.5 text-base leading-none">
                      {TYPE_ICONS[notif.type] || '🔔'}
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {notif.body}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>

                    {/* Link indicator */}
                    {notif.link && (
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-center text-xs text-muted-foreground">
                Menampilkan {notifications.length} notifikasi terbaru
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
