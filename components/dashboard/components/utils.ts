export const PROJECT_STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'On Hold', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  1: { label: 'Pending', color: 'bg-muted text-muted-foreground border-border' },
  2: { label: 'On Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  5: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  6: { label: 'In Review', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

export const PARETO_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
