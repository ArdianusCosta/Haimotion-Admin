'use client'

import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { User } from '@/types/user'
import { useDeleteUser } from '@/hooks/use-users'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserDeleteDialog({ open, onOpenChange, user }: UserDeleteDialogProps) {
  const { t } = useLanguage()
  const deleteMutation = useDeleteUser(() => onOpenChange(false))

  if (!open || !user) return null

  const handleDelete = () => {
    deleteMutation.mutate(user.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
        <h2 className="text-lg font-semibold text-foreground">{t('Delete User?')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Are you sure you want to delete')} <strong>{user.firstname}</strong>? {t('This action cannot be undone.')}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">{t('Cancel')}</button>
          <button onClick={handleDelete} disabled={deleteMutation.isPending} className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
            {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : t('Yes, delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
