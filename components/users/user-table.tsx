'use client'

import { Edit2, Trash2, Power } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/components/language-provider'
import { User } from '@/types/user'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const roleColors: Record<string, { bg: string, text: string }> = {
  'Administrator': { bg: 'bg-purple-500/15 dark:bg-purple-500/25', text: 'text-purple-700 dark:text-purple-300' },
  'Admin':         { bg: 'bg-purple-500/15 dark:bg-purple-500/25', text: 'text-purple-700 dark:text-purple-300' },
  'Editor':        { bg: 'bg-blue-500/15 dark:bg-blue-500/25',   text: 'text-blue-700 dark:text-blue-300' },
  'Staff':         { bg: 'bg-emerald-500/15 dark:bg-emerald-500/25', text: 'text-emerald-700 dark:text-emerald-300' },
  'Developer':     { bg: 'bg-sky-500/15 dark:bg-sky-500/25',     text: 'text-sky-700 dark:text-sky-300' },
  'Viewer':        { bg: 'bg-slate-500/15 dark:bg-slate-500/25', text: 'text-slate-600 dark:text-slate-300' },
  'Client':        { bg: 'bg-amber-500/15 dark:bg-amber-500/25', text: 'text-amber-700 dark:text-amber-300' },
  'test':          { bg: 'bg-rose-500/15 dark:bg-rose-500/25',   text: 'text-rose-700 dark:text-rose-300' },
}

const roleTranslationsID: Record<string, string> = {
  'Staff':       'Karyawan',
  'Developer':   'Pengembang',
  'Editor':      'Editor',
  'Administrator': 'Administrator',
  'Viewer':      'Penampil',
  'Client':      'Klien',
}

type UserTableProps = {
  users: User[]
  isLoading: boolean
  pagination: { total: number, page: number, limit: number, totalPages: number }
  page: number
  setPage: (page: number | ((p: number) => number)) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onStatusChange: (user: User) => void
}

export function UserTable({ users, isLoading, pagination, page, setPage, onEdit, onDelete, onStatusChange }: UserTableProps) {
  const { t, language } = useLanguage()

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-5 py-3 font-medium text-muted-foreground">{t('No.')}</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">{t('Name')}</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">{t('Email')}</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">{t('Role Type')}</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">{t('Joined At')}</th>
              <th className="px-5 py-3 font-medium text-muted-foreground">{t('Status')}</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-in fade-in duration-500">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">{t('No users found.')}</td>
              </tr>
            ) : (
              users.map((user, index) => {
                const roleName = user.role?.name || 'Staff'
                const roleColor = roleColors[roleName] || { bg: 'bg-muted', text: 'text-muted-foreground' }
                const displayName = language === 'id'
                  ? (roleTranslationsID[roleName] || roleName)
                  : roleName
                return (
                  <tr key={user.id} className="transition-colors hover:bg-muted/50 group">
                    <td className="px-5 py-3 text-muted-foreground">{(page - 1) * pagination.limit + index + 1}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{user.firstname} {user.lastname}</td>
                    <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                        {displayName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(user.date_created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === 'resign' ? 'bg-destructive/15 text-destructive' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'}`}>
                        {user.status === 'resign' ? t('Resign') : t('Active')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onStatusChange(user)} title={t('Toggle Status')} className={`rounded-md p-1.5 hover:bg-muted hover:text-foreground ${user.status === 'resign' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          <Power className="size-4" />
                        </button>
                        <button onClick={() => onEdit(user)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Edit2 className="size-4" />
                        </button>
                        <button onClick={() => onDelete(user)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {!isLoading && users.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <span className="text-sm text-muted-foreground">
            {t('Showing')} <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> {t('to')} <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> {t('of')} <strong>{pagination.total}</strong> {t('results')}
          </span>
          <div className="flex items-center gap-1 rounded-full bg-background border border-border p-1 shadow-sm">
            <button 
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${page === pageNum ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button 
              onClick={() => setPage((p: number) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
