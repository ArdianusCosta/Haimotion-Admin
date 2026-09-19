import React from 'react'
import { useLanguage } from '@/components/language-provider'

// --- Finance Page Header ---
export function FinancePageHeader({ title, description, actions }: { title: string, description?: string, actions?: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

// --- Finance Summary Card ---
interface FinanceSummaryCardProps {
  title: string
  amount: string | number
  subtitle?: string
  icon?: React.ReactNode
  iconBgColor?: string
  iconColor?: string
}
export function FinanceSummaryCard({ title, amount, subtitle, icon, iconBgColor = 'bg-primary/10', iconColor = 'text-primary' }: FinanceSummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && (
          <span className={`flex size-8 items-center justify-center rounded-lg ${iconBgColor}`}>
            <span className={iconColor}>{icon}</span>
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{amount}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// --- Finance Status Badge ---
export function FinanceStatusBadge({ status }: { status: string }) {
  let bg = 'bg-muted/50'
  let text = 'text-muted-foreground'

  if (['Paid', 'Sent', 'Approved'].includes(status)) {
    bg = 'bg-emerald-500/10'
    text = 'text-emerald-500'
  } else if (['Overdue', 'Rejected', 'Cancelled'].includes(status)) {
    bg = 'bg-rose-500/10'
    text = 'text-rose-500'
  } else if (['Pending', 'Draft'].includes(status)) {
    bg = 'bg-amber-500/10'
    text = 'text-amber-500'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  )
}

// --- Finance Empty State ---
export function FinanceEmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
        <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
