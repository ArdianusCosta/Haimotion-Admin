'use client'

import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { User } from '@/types/user'
import { useUpdateUserStatus } from '@/hooks/use-users'

type UserStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserStatusDialog({ open, onOpenChange, user }: UserStatusDialogProps) {
  const { t } = useLanguage()
  const statusMutation = useUpdateUserStatus(() => onOpenChange(false))

  if (!open || !user) return null

  const handleStatusChange = () => {
    statusMutation.mutate(user)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
        <h2 className="text-lg font-semibold text-foreground">{t('Change User Status?')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Are you sure you want to change the status for')} <strong>{user.firstname}</strong> {t('to')} <strong>{user.status === 'resign' ? t('Active') : t('Resign')}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">{t('Cancel')}</button>
          <button onClick={handleStatusChange} disabled={statusMutation.isPending} className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {statusMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : t('Yes, change')}
          </button>
        </div>
      </div>
    </div>
  )
}
