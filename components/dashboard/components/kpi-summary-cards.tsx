'use client'

import { useRouter } from 'next/navigation'
import { Users, FolderKanban, CheckSquare } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

interface KpiSummaryCardsProps {
  data: any
}

export function KpiSummaryCards({ data }: KpiSummaryCardsProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const isId = language === 'id'

  const { kpis } = data

  const totalUsers = kpis?.totalUsers?.value ?? 0
  const activeUsers = kpis?.totalUsers?.activeCount ?? 0
  const inactiveUsers = kpis?.totalUsers?.inactiveCount ?? 0
  const totalProjects = kpis?.totalProjects?.value ?? 0
  const totalTasks = kpis?.totalTasks?.value ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">

      {/* ── Total Users Card (special) ── */}
      <div
        onClick={() => router.push('/users')}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 cursor-pointer flex items-center justify-between min-w-0 gap-3"
      >
        <div className="min-w-0 flex-1">
          {/* active / total */}
          <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate">
            <span className="text-emerald-500 group-hover:brightness-110 transition-all">
              {activeUsers.toLocaleString()}
            </span>
            <span className="text-muted-foreground/60 mx-0.5">/</span>
            <span className="text-red-500 group-hover:brightness-110 transition-all">
              {totalUsers.toLocaleString()}
            </span>
          </p>
          {/* status label */}
          <p className="text-xs font-medium text-muted-foreground mt-1.5 leading-relaxed truncate">
            <span className="text-emerald-500 font-semibold">{activeUsers}</span>
            {' '}{isId ? 'Aktif' : 'Active'} ·{' '}
            <span className="text-red-500 font-semibold">{inactiveUsers}</span>
            {' '}{isId ? 'Tidak Aktif' : 'Inactive'}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-wide truncate">
            {isId ? 'Total Pengguna' : 'Total Users'}
          </p>
        </div>
        <div className="size-12 sm:size-14 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner transition-transform group-hover:scale-110 duration-200 shrink-0">
          <Users className="size-6 sm:size-7" />
        </div>
      </div>

      {/* ── Total Projects Card ── */}
      <div
        onClick={() => router.push('/projects')}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 cursor-pointer flex items-center justify-between min-w-0 gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight group-hover:text-emerald-500 transition-colors truncate">
            {totalProjects.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
            {isId ? 'Total Proyek' : 'Total Projects'}
          </p>
        </div>
        <div className="size-12 sm:size-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner transition-transform group-hover:scale-110 duration-200 shrink-0">
          <FolderKanban className="size-6 sm:size-7" />
        </div>
      </div>

      {/* ── Total Tasks Card ── */}
      <div
        onClick={() => router.push('/tasks')}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer flex items-center justify-between min-w-0 gap-3 sm:col-span-2 lg:col-span-1"
      >
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
            {totalTasks.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
            {isId ? 'Total Tugas' : 'Total Tasks'}
          </p>
        </div>
        <div className="size-12 sm:size-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-inner transition-transform group-hover:scale-110 duration-200 shrink-0">
          <CheckSquare className="size-6 sm:size-7" />
        </div>
      </div>

    </div>
  )
}
