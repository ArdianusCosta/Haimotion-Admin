'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import {
  BarChart3,
  Target,
  Users,
  Trophy,
  Medal,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Flame,
  Star,
  Eye,
  FileSpreadsheet,
  FileText,
  PlayCircle,
  Info,
  ListTodo,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import { useKpiPerformance } from '@/hooks/use-kpi-performance'
import { MemberKpi, ProjectKpiDetail } from '@/app/actions/dashboard-kpi'
import { PROJECT_STATUS_LABELS } from './utils'

// ─── Score Badge Helper (Pill & Circle, Perfectly Rounded, No Awkward Wrap) ───
function ScoreBadge({
  score,
  variant = 'pill'
}: {
  score: number
  variant?: 'pill' | 'circle'
}) {
  const color =
    score >= 70
      ? 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/20'
      : score >= 40
      ? 'text-amber-500 bg-amber-500/15 border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/20'
      : 'text-rose-500 bg-rose-500/15 border-rose-500/30 dark:text-rose-400 dark:bg-rose-500/20'

  if (variant === 'circle') {
    return (
      <div
        className={`size-12 rounded-full border-2 flex flex-col items-center justify-center font-black shrink-0 aspect-square shadow-xs leading-none select-none ${color}`}
      >
        <span className="text-xs font-black">{score}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 mt-0.5">pts</span>
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border whitespace-nowrap shrink-0 shadow-2xs select-none ${color}`}
    >
      <span className="font-extrabold">{score}</span>
      <span className="text-[10px] font-bold opacity-75 uppercase tracking-wider">pts</span>
    </span>
  )
}

// ─── Rank Badge Helper ────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center size-8 rounded-full bg-amber-400/20 border border-amber-400/50 shadow-xs">
        <Trophy className="size-4 text-amber-500 fill-amber-500" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center size-8 rounded-full bg-slate-300/30 border border-slate-400/50">
        <Medal className="size-4 text-slate-500 dark:text-slate-300" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center size-8 rounded-full bg-orange-400/20 border border-orange-400/50">
        <Award className="size-4 text-orange-600 dark:text-orange-400" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center size-8 rounded-full bg-muted border border-border/60">
      <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
    </div>
  )
}

// ─── Sub-component: Podium Top 3 ─────────────────────────────────────────────
function LeaderboardPodium({
  members,
  onSelectMember
}: {
  members: any[]
  onSelectMember: (m: any) => void
}) {
  const top3 = members.slice(0, 3)
  if (top3.length === 0) return null

  // Order for podium visually: [2nd, 1st, 3rd]
  const podiumOrder = [
    top3[1] || null, // 2nd place
    top3[0] || null, // 1st place
    top3[2] || null  // 3rd place
  ]
  const heights = ['h-24 sm:h-28', 'h-32 sm:h-36', 'h-20 sm:h-24']
  const podiumColors = [
    'bg-slate-200/60 border-slate-300/80 dark:bg-slate-800/40 dark:border-slate-700',
    'bg-amber-400/20 border-amber-400/60 shadow-amber-500/10 shadow-lg',
    'bg-orange-300/20 border-orange-400/50'
  ]
  const badgeIcons = [
    <Medal className="size-5 text-slate-400 shrink-0" key="medal" />,
    <Trophy className="size-6 text-amber-500 fill-amber-500 shrink-0" key="trophy" />,
    <Award className="size-5 text-orange-500 shrink-0" key="award" />
  ]

  return (
    <div className="rounded-2xl border border-border bg-linear-to-b from-card to-muted/20 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <h3 className="font-bold text-sm text-foreground">Top 3 Performer Karyawan</h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          Berdasarkan Skor KPI Gabungan
        </span>
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4">
        {podiumOrder.map((member, i) => {
          if (!member) return <div key={i} className="w-20 sm:w-28" />
          const rank = i === 1 ? 1 : i === 0 ? 2 : 3

          return (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              className="flex flex-col items-center gap-2 cursor-pointer group transition-transform hover:-translate-y-1"
            >
              {/* Avatar + badge */}
              <div className="relative">
                <Avatar
                  className={`${
                    rank === 1
                      ? 'size-14 sm:size-16 ring-4 ring-amber-400/70 shadow-lg'
                      : 'size-11 sm:size-12 ring-2 ring-border shadow-xs'
                  }`}
                >
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm font-bold">
                    {member.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1.5 -right-1.5 bg-card rounded-full p-0.5 border border-border shadow-xs">
                  {badgeIcons[i]}
                </div>
              </div>

              {/* Name & Rate */}
              <div className="text-center max-w-[115px] sm:max-w-[140px] flex flex-col items-center">
                <p className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate w-full group-hover:text-primary transition-colors">
                  {member.name}
                </p>
                <div className="flex flex-col items-center gap-1 mt-1">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {member.completionRate}% Done
                  </span>
                  <ScoreBadge score={member.score ?? member.performanceScore ?? 0} />
                </div>
              </div>

              {/* Podium Block */}
              <div
                className={`w-20 sm:w-28 ${heights[i]} rounded-t-xl border ${podiumColors[i]} flex flex-col items-center justify-center`}
              >
                <span className="text-xl sm:text-2xl font-black text-foreground/80">#{rank}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {rank === 1 ? 'Juara 1' : rank === 2 ? 'Juara 2' : 'Juara 3'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Unified Component Props ─────────────────────────────────────────────
interface TeamKpiSectionProps {
  data: any
  range?: string
  projectFilter?: string
}

export function TeamKpiSection({
  data,
  range = 'All time',
  projectFilter = 'Semua Project'
}: TeamKpiSectionProps) {
  const { language, t } = useLanguage()
  const isId = language === 'id'

  // Navigation & Sub-views with preference persistence
  const [activeTab, setActiveTabState] = useState<'overview' | 'leaderboard' | 'performance' | 'projects'>('overview')
  const [filterMode, setFilterModeState] = useState<'active' | 'all'>('all')
  const [memberFilter, setMemberFilter] = useState('Semua Anggota')

  // Load user tab & filter preferences on mount
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('pref_team_kpi_tab')
      if (savedTab && ['overview', 'leaderboard', 'performance', 'projects'].includes(savedTab)) {
        setActiveTabState(savedTab as any)
      }
      const savedMode = localStorage.getItem('pref_team_kpi_filter_mode')
      if (savedMode && ['active', 'all'].includes(savedMode)) {
        setFilterModeState(savedMode as any)
      }
    } catch (_) {}
  }, [])

  const setActiveTab = (tab: 'overview' | 'leaderboard' | 'performance' | 'projects') => {
    setActiveTabState(tab)
    try {
      localStorage.setItem('pref_team_kpi_tab', tab)
    } catch (_) {}
  }

  const setFilterMode = (mode: 'active' | 'all') => {
    setFilterModeState(mode)
    try {
      localStorage.setItem('pref_team_kpi_filter_mode', mode)
    } catch (_) {}
  }

  // Modals
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({})

  // Fetch KPI performance data (for live leaderboard scores & per-project breakdowns)
  const { loading: kpiLoading, isFetching: kpiFetching, data: kpiData } = useKpiPerformance(
    range,
    projectFilter,
    memberFilter
  )

  const rawTeamData: any[] = data?.teamAssignments || []

  // Pre-filter between active current team members and everyone
  const teamPool = useMemo(() => {
    let pool = rawTeamData
    if (filterMode === 'active') {
      const activeOnly = pool.filter(m => !m.isResigned)
      pool = activeOnly.length > 0 ? activeOnly : pool
    }
    if (memberFilter !== 'Semua Anggota') {
      pool = pool.filter(m => m.id.toString() === memberFilter)
    }
    return pool
  }, [rawTeamData, filterMode, memberFilter])

  // Merge performance score and calculate metrics
  const enrichedTeamData = useMemo(() => {
    const kpiMap = new Map<number, MemberKpi>((kpiData?.memberKpis || []).map(k => [k.id, k]))

    return teamPool.map((m: any) => {
      const kpi = kpiMap.get(m.id)
      let score: number | undefined = kpi?.performanceScore

      if (score === undefined) {
        // Fallback transparent formula
        const assigned = m.assigned || 0
        const done = m.done || 0
        const rate = m.completionRate || 0
        const workloadScore = Math.min(assigned / 10, 1) * 100
        const overdue = m.overdue || 0
        const timelinessScore = done > 0 ? Math.max(0, 100 - (overdue / done) * 50) : 100
        score = Math.round(((rate * 0.50) + (workloadScore * 0.30) + (timelinessScore * 0.20)) * 10) / 10
      }

      return {
        ...m,
        score,
        onTimeCount: kpi?.onTimeCount ?? m.done
      }
    })
  }, [teamPool, kpiData])

  // Ranked members for Leaderboard
  const rankedMembers = useMemo(() => {
    const list = [...enrichedTeamData]
    return list
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate
        if (b.assigned !== a.assigned) return b.assigned - a.assigned
        return a.name.localeCompare(b.name)
      })
      .map((m, idx) => ({ ...m, rank: idx + 1 }))
  }, [enrichedTeamData])

  // Summary Metrics calculated live
  const summaryMetrics = useMemo(() => {
    const totals = enrichedTeamData.reduce(
      (acc, curr) => {
        acc.totalAssigned += curr.assigned || 0
        acc.totalDone += curr.done || 0
        acc.totalInProgress += curr.inProgress || 0
        acc.totalRevised += curr.revised || 0
        acc.totalOverdue += curr.overdue || 0
        return acc
      },
      { totalAssigned: 0, totalDone: 0, totalInProgress: 0, totalRevised: 0, totalOverdue: 0 }
    )

    const avgRate =
      totals.totalAssigned > 0
        ? Math.round((totals.totalDone / totals.totalAssigned) * 1000) / 10
        : 0

    return { ...totals, avgRate }
  }, [enrichedTeamData])

  const toggleProject = (projectId: number) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  // Export tasks as CSV / Excel
  const handleExportCsv = (member: any) => {
    if (!member || !member.projects) return
    let csv = 'Project,Task Name,Status,Deadline,Content Pillar\n'
    member.projects.forEach((prj: any) => {
      (prj.tasks || []).forEach((t: any) => {
        const cleanName = (t.name || '').replace(/"/g, '""')
        const prjName = (prj.name || '').replace(/"/g, '""')
        csv += `"${prjName}","${cleanName}","${t.statusLabel}","${t.deadline}","${t.pillar || '-'}"\n`
      })
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `KPI_Tasks_${member.name.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const tabs = [
    { key: 'overview', label: isId ? 'Overview Grafik' : 'Chart Overview', icon: BarChart3 },
    { key: 'leaderboard', label: isId ? 'Leaderboard & Ranking' : 'Leaderboard & Ranking', icon: Trophy },
    { key: 'performance', label: isId ? 'Kartu Performa Tim' : 'Team Performance Cards', icon: Users },
    { key: 'projects', label: isId ? 'Distribusi Per Project' : 'Project Distribution', icon: FolderKanban }
  ] as const

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col space-y-6">
      {/* ─── 1. Header Toolbar (Title, Filters, SOP Guide) ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 sm:size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Target className="size-5 sm:size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                {isId ? 'KPI & Produktivitas Tim' : 'Team KPI & Productivity'}
              </h2>
              <Badge variant="outline" className="text-[11px] font-semibold bg-muted/60">
                {kpiData?.periodLabel || range}
              </Badge>
              {kpiFetching && (
                <span className="text-[11px] text-primary animate-pulse flex items-center gap-1 font-medium">
                  <span className="size-1.5 rounded-full bg-primary inline-block" />
                  {isId ? 'Memperbarui...' : 'Updating...'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isId
                ? 'Pantau distribusi tugas, tingkat penyelesaian (completion rate), peringkat performa, dan kontribusi tim'
                : 'Monitor task distribution, completion rates, performance rankings, and team contributions'}
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active / All Toggle */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'active'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isId ? 'Tim Aktif' : 'Active Team'} ({rawTeamData.filter(m => !m.isResigned).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isId ? 'Semua' : 'All'} ({rawTeamData.length})
            </button>
          </div>

          {/* Member Filter Dropdown */}
          <Select value={memberFilter} onValueChange={(v) => setMemberFilter(v ?? 'Semua Anggota')}>
            <SelectTrigger className="h-8 w-[150px] sm:w-[170px] text-xs bg-background">
              <SelectValue placeholder={isId ? 'Semua Anggota' : 'All Members'} />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Semua Anggota">Semua Anggota</SelectItem>
              {(kpiData?.allUsers || rawTeamData).map((u: any) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.name || `${u.firstname || ''} ${u.lastname || ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* SOP Guide Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTutorial(true)}
            className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <PlayCircle className="size-3.5" />
            <span className="hidden sm:inline">Panduan SOP</span>
          </Button>
        </div>
      </div>

      {/* ─── 2. Unified Live KPI Summary Metric Cards (5 Cards) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-semibold">Total Ditugaskan</span>
            <ListTodo className="size-3.5" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {summaryMetrics.totalAssigned}
            </span>
            <span className="text-xs font-normal text-muted-foreground ml-1">task</span>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold">Tugas Selesai (Done)</span>
            <CheckCircle2 className="size-3.5" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {summaryMetrics.totalDone}
            </span>
            <span className="text-xs font-normal text-muted-foreground ml-1">task</span>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-semibold">Dalam Pengerjaan</span>
            <Clock className="size-3.5" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {summaryMetrics.totalInProgress}
            </span>
            <span className="text-xs font-normal text-muted-foreground ml-1">task</span>
          </div>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[11px] font-semibold">Revisi / Overdue</span>
            <RotateCcw className="size-3.5" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {summaryMetrics.totalRevised + summaryMetrics.totalOverdue}
            </span>
            <span className="text-xs font-normal text-muted-foreground ml-1">task</span>
          </div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-violet-600 dark:text-violet-400">
            <span className="text-[11px] font-semibold">Rata-rata Selesai</span>
            <TrendingUp className="size-3.5" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {summaryMetrics.avgRate}%
            </span>
            <span className="text-xs font-normal text-muted-foreground ml-1">rate</span>
          </div>
        </div>
      </div>

      {/* ─── 3. Unified View Switcher Tabs ─── */}
      <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl w-full sm:w-fit overflow-x-auto border border-border/60">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── 4. TAB 1: OVERVIEW GRAFIK (Dual Bar Chart Assigned vs Done) ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Legend and Helper Callouts */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium pt-1 border-t border-border/40">
            <p className="text-muted-foreground text-xs">
              Menampilkan {enrichedTeamData.length} anggota tim. Klik pada nama atau bar untuk detail tugas.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs bg-[#3b82f6]" />
                <span className="text-muted-foreground">Tasks Assigned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs bg-[#10b981]" />
                <span className="text-muted-foreground">Tasks Done</span>
              </div>
            </div>
          </div>

          {/* Dual Bar Chart */}
          {enrichedTeamData.length > 0 ? (
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
              <div
                style={{
                  minWidth: enrichedTeamData.length > 8 ? `${enrichedTeamData.length * 60}px` : '100%',
                  height: '330px'
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enrichedTeamData}
                    margin={{ top: 20, right: 15, left: -15, bottom: 50 }}
                    barGap={3}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      dx={-4}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null
                        const item = payload[0].payload
                        return (
                          <div className="bg-popover border border-border rounded-xl p-3 shadow-lg space-y-1.5 text-xs min-w-[220px]">
                            <div className="border-b border-border/60 pb-1.5 mb-1.5 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-foreground text-sm">{item.fullName || item.name}</p>
                                <p className="text-[11px] text-muted-foreground">{item.role}</p>
                              </div>
                              <ScoreBadge score={item.score} />
                            </div>
                            <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                              <span>Ditugaskan (Assigned):</span>
                              <span>{item.assigned} task</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>Selesai (Done):</span>
                              <span>{item.done} task</span>
                            </div>
                            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                              <span>Dalam Pengerjaan:</span>
                              <span>{item.inProgress} task</span>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                              <span>Putaran Revisi:</span>
                              <span>{item.revised} task</span>
                            </div>
                            <div className="pt-1.5 border-t border-border/60 flex justify-between font-bold text-foreground">
                              <span>Tingkat Selesai:</span>
                              <span>{item.completionRate}%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 text-center pt-1 italic">
                              Klik tombol di bawah untuk rincian tugas
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="assigned"
                      name="Tasks Assigned"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                      className="cursor-pointer"
                      onClick={(entry) => setSelectedMember(entry)}
                    />
                    <Bar
                      dataKey="done"
                      name="Tasks Done"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                      className="cursor-pointer"
                      onClick={(entry) => setSelectedMember(entry)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <Users className="size-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">Belum ada data penugasan anggota tim untuk project/periode ini</p>
            </div>
          )}

          {/* Quick Jump Buttons to Leaderboard and SOP */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs cursor-pointer"
            >
              <Trophy className="size-4" />
              <span>LIHAT FULL RANKING & LEADERBOARD BEST EMPLOYEE</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span>Panduan SOP Revisi & Overdue</span>
              <PlayCircle className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── 5. TAB 2: LEADERBOARD & RANKING (Podium + Full Table) ─── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Formula Transparency Card */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Target className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Formula Penilaian KPI Karyawan</p>
                <p className="mt-0.5 text-[11px]">
                  Skor = (Tingkat Selesai × 50%) + (Beban Kerja × 30%) + (Ketepatan Waktu × 20%)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs shrink-0">
              <Star className="size-4 fill-amber-500 text-amber-500" />
              <span>Pedoman Penilaian Karyawan Terbaik</span>
            </div>
          </div>

          {/* Top 3 Podium */}
          {rankedMembers.length >= 2 && (
            <LeaderboardPodium members={rankedMembers} onSelectMember={(m) => setSelectedMember(m)} />
          )}

          {/* Full Leaderboard Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">Peringkat Lengkap Karyawan</h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Total {rankedMembers.length} Orang
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">RANK</th>
                    <th className="py-3 px-4">KARYAWAN</th>
                    <th className="py-3 px-4 text-center w-24">ASSIGNED</th>
                    <th className="py-3 px-4 text-center w-24">DONE</th>
                    <th className="py-3 px-4 text-center w-20">OVERDUE</th>
                    <th className="py-3 px-4 w-40">COMPLETION</th>
                    <th className="py-3 px-4 text-center w-28">SKOR KPI</th>
                    <th className="py-3 px-4 text-center w-20">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rankedMembers.map((member) => {
                    const isFirst = member.rank === 1

                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          member.rank <= 3 ? 'bg-muted/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">
                          <RankBadge rank={member.rank} />
                        </td>

                        {/* Member */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 border border-border shrink-0">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground text-xs sm:text-sm">
                                  {member.fullName || member.name}
                                </span>
                                {isFirst && (
                                  <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    ★ BEST EMPLOYEE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {member.role || 'Creative Staff'} • {member.projectCount || (member.projects || []).length} project
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Assigned */}
                        <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                          {member.assigned}
                        </td>

                        {/* Done */}
                        <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {member.done}
                        </td>

                        {/* Overdue */}
                        <td className="py-3 px-4 text-center font-semibold">
                          {member.overdue > 0 ? (
                            <span className="text-rose-500 font-bold">{member.overdue}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>

                        {/* Completion */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  member.completionRate >= 80
                                    ? 'bg-emerald-500'
                                    : member.completionRate >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(member.completionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {member.completionRate}% Selesai
                            </span>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3 px-4 text-center">
                          <ScoreBadge score={member.score} />
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedMember(member)}
                            title="Lihat Detail Rincian Tugas & Project"
                            className="size-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. TAB 3: KARTU PERFORMA TIM (Grid of Cards) ─── */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedMembers.length === 0 ? (
            <div className="col-span-full h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-sm">
              <Users className="size-8 mb-2 opacity-40" />
              <p>Tidak ada data anggota tim untuk filter ini</p>
            </div>
          ) : (
            rankedMembers.map((member) => {
              const completionColor =
                member.completionRate >= 70
                  ? 'bg-emerald-500'
                  : member.completionRate >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500'

              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Rank, Score */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar className="size-11">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {member.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {member.rank <= 3 && (
                            <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-card flex items-center justify-center border border-border shadow-2xs">
                              {member.rank === 1 && <Trophy className="size-3 text-amber-500 fill-amber-500" />}
                              {member.rank === 2 && <Medal className="size-3 text-slate-400" />}
                              {member.rank === 3 && <Award className="size-3 text-orange-500" />}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{member.fullName || member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.role || 'Creative Staff'}</p>
                        </div>
                      </div>
                      <ScoreBadge score={member.score} />
                    </div>

                    {/* Completion rate bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5 font-medium">
                        <span className="text-muted-foreground">Tingkat Selesai</span>
                        <span className="font-bold text-foreground">{member.completionRate}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${completionColor} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(member.completionRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center rounded-lg bg-muted/40 py-2.5">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{member.done}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Selesai</p>
                      </div>
                      <div className="text-center rounded-lg bg-muted/40 py-2.5">
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{member.inProgress}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Progress</p>
                      </div>
                      <div className="text-center rounded-lg bg-muted/40 py-2.5">
                        <p className="text-sm font-bold text-rose-500">{member.overdue + (member.revised || 0)}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Revisi/Overdue</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMember(member)}
                    className="w-full mt-4 text-xs font-semibold gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Eye className="size-3.5" />
                    <span>Lihat Detail Tugas ({member.assigned})</span>
                  </Button>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ─── 7. TAB 4: DISTRIBUSI PER PROJECT (Accordion with Member Contributions) ─── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FolderKanban className="size-4 text-primary" />
              Kontribusi Tim di Seluruh Project
            </h3>
            <span className="text-xs text-muted-foreground">
              {(kpiData?.projectBreakdowns || []).length} Project Aktif
            </span>
          </div>

          {(kpiData?.projectBreakdowns || []).length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-sm">
              <FolderKanban className="size-8 mb-2 opacity-40" />
              <p>Belum ada data project dalam periode ini</p>
            </div>
          ) : (
            (kpiData?.projectBreakdowns || []).map((project: ProjectKpiDetail) => {
              const isOpen = expandedProjects[project.id] ?? false
              const statusConf = PROJECT_STATUS_LABELS[project.status] || PROJECT_STATUS_LABELS[1]

              return (
                <div key={project.id} className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
                  {/* Project Header Row */}
                  <button
                    type="button"
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground truncate">{project.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                    </div>

                    {/* Stats pills */}
                    <div className="hidden sm:flex items-center gap-5 shrink-0 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-foreground">{project.totalTasks}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-600">{project.completedTasks}</p>
                        <p className="text-[10px] text-muted-foreground">Selesai</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-rose-500">{project.overdueTasks}</p>
                        <p className="text-[10px] text-muted-foreground">Overdue</p>
                      </div>
                    </div>

                    {/* Completion bar */}
                    <div className="hidden md:flex items-center gap-2 w-[140px] shrink-0">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            project.completionRate >= 70
                              ? 'bg-emerald-500'
                              : project.completionRate >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${project.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-10 text-right">
                        {project.completionRate}%
                      </span>
                    </div>

                    <div className="shrink-0 text-muted-foreground">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </div>
                  </button>

                  {/* Expanded: member contributions */}
                  {isOpen && (
                    <div className="border-t border-border px-5 py-4 bg-muted/20 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Kontribusi Anggota Tim Pada Project Ini
                      </p>
                      {project.memberContributions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Tidak ada data penugasan anggota di project ini</p>
                      ) : (
                        <div className="space-y-2.5">
                          {project.memberContributions.map((m) => {
                            const memberRate = m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0
                            return (
                              <div key={m.userId} className="flex items-center gap-3">
                                <Avatar className="size-7 shrink-0">
                                  <AvatarImage src={m.avatar} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                                    {m.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                                    <p className="text-xs text-muted-foreground shrink-0 ml-2">
                                      {m.completed}/{m.assigned} task selesai
                                    </p>
                                  </div>
                                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        memberRate >= 70 ? 'bg-emerald-500' : memberRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${memberRate}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-foreground w-10 text-right shrink-0">
                                  {memberRate}%
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ─── MODAL 1: DETAIL TUGAS & PROYEK PER KARYAWAN (Drilldown) ─── */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border border-border shadow-2xl bg-card">
          {selectedMember && (() => {
            const isResigned =
              selectedMember.isResigned ||
              (selectedMember.fullName || selectedMember.name || '').toLowerCase().includes('[resign]')
            const cleanName = (selectedMember.fullName || selectedMember.name || '')
              .replace(/\[RESIGN\]\s*/i, '')
              .replace(/\s*\([^)]*\).*/g, '')
              .trim() || selectedMember.name || 'User'
            const memberRole = selectedMember.role || 'Creative Staff'

            return (
              <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
                {/* Sticky Header */}
                <div className="border-b border-border pl-6 pr-14 py-4 bg-card/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <BarChart3 className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                        Detail Kinerja & Penugasan — {cleanName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rincian beban kerja, progres per project, dan status setiap tugas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Profile Card */}
                  <div className="rounded-2xl border border-border bg-muted/30 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-16 border-2 border-border shadow-sm shrink-0">
                        <AvatarImage src={selectedMember.avatar} />
                        <AvatarFallback className="bg-primary/15 text-primary font-black text-lg">
                          {cleanName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-extrabold text-lg text-foreground truncate">
                            {cleanName}
                          </h4>
                          {isResigned && (
                            <Badge variant="destructive" className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5">
                              Resigned
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30 px-2.5 py-0.5">
                            {memberRole}
                          </Badge>
                          {selectedMember.score !== undefined && (
                            <ScoreBadge score={selectedMember.score} />
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {selectedMember.email && (
                            <span className="flex items-center gap-1.5">
                              ✉️ {selectedMember.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium">
                            📁 {selectedMember.projectCount || (selectedMember.projects || []).length} Project Aktif
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleExportCsv(selectedMember)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9 font-semibold shadow-xs transition-colors"
                      >
                        <FileSpreadsheet className="size-4" />
                        <span>Export Excel (CSV)</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.print()}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-9 font-semibold shadow-xs transition-colors"
                      >
                        <FileText className="size-4" />
                        <span>Print / PDF</span>
                      </Button>
                    </div>
                  </div>

                  {/* 4 Spacious Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="border border-border/80 rounded-xl p-4 bg-card shadow-xs">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">TOTAL PROJECTS</span>
                        <FolderKanban className="size-4 text-primary" />
                      </div>
                      <p className="text-2xl font-black text-foreground">
                        {selectedMember.projectCount || (selectedMember.projects || []).length}
                      </p>
                      <span className="text-[11px] text-muted-foreground font-medium">project terlibat</span>
                    </div>

                    <div className="border border-border/80 rounded-xl p-4 bg-card shadow-xs">
                      <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">DITUGASKAN</span>
                        <ListTodo className="size-4" />
                      </div>
                      <p className="text-2xl font-black text-foreground">
                        {selectedMember.assigned}
                      </p>
                      <span className="text-[11px] text-muted-foreground font-medium">total tugas</span>
                    </div>

                    <div className="border border-border/80 rounded-xl p-4 bg-card shadow-xs">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">SELESAI (DONE)</span>
                        <CheckCircle2 className="size-4" />
                      </div>
                      <p className="text-2xl font-black text-foreground">
                        {selectedMember.done}
                      </p>
                      <span className="text-[11px] text-muted-foreground font-medium">tugas terselesaikan</span>
                    </div>

                    <div className="border border-border/80 rounded-xl p-4 bg-card shadow-xs">
                      <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">COMPLETION RATE</span>
                        <TrendingUp className="size-4" />
                      </div>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        {selectedMember.completionRate}%
                      </p>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            selectedMember.completionRate >= 70
                              ? 'bg-emerald-500'
                              : selectedMember.completionRate >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(selectedMember.completionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Projects & Tasks Accordions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FolderKanban className="size-4 text-primary" />
                        Rincian Penugasan Berdasarkan Project
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {(selectedMember.projects || []).length} Project Terdaftar
                      </span>
                    </div>

                    {(selectedMember.projects || []).length > 0 ? (
                      (selectedMember.projects || []).map((prj: any) => {
                        const isExpanded = expandedProjects[prj.id] ?? true

                        return (
                          <div key={prj.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                            <div
                              onClick={() => toggleProject(prj.id)}
                              className="p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors select-none"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[11px] font-bold">
                                  Project
                                </Badge>
                                <span className="font-extrabold text-sm text-foreground">
                                  {prj.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-xs font-semibold text-muted-foreground">
                                  <span className="text-foreground font-bold">{prj.completedTasks}</span>/{prj.totalTasks} Selesai{' '}
                                  <span className="text-emerald-600 dark:text-emerald-400">({prj.completionRate}%)</span>
                                </div>
                                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Progress Line */}
                            <div className="h-1 w-full bg-muted">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${Math.min(prj.completionRate, 100)}%` }}
                              />
                            </div>

                            {/* Task List Table */}
                            {isExpanded && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-muted/20 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider border-b border-border/60">
                                    <tr>
                                      <th className="py-3 px-5">Nama Tugas</th>
                                      <th className="py-3 px-5 text-center w-36">Status</th>
                                      <th className="py-3 px-5 text-right w-40">Deadline</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/40">
                                    {(prj.tasks || []).map((t: any) => (
                                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-5">
                                          <div className="space-y-1">
                                            <p className="font-semibold text-foreground text-xs leading-snug">{t.name}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {t.pillar && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium border border-amber-500/20">
                                                  🏷️ {t.pillar}
                                                </span>
                                              )}
                                              {t.platform && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium border border-blue-500/20">
                                                  📱 {t.platform}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                                            t.status === 5
                                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                              : t.status === 6 || t.status === 2
                                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                                              : t.status === 4
                                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                              : t.status === 8
                                              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40'
                                              : 'bg-muted text-muted-foreground border-border'
                                          }`}>
                                            {t.statusLabel}
                                          </span>
                                        </td>
                                        <td className="py-3 px-5 text-right font-medium text-muted-foreground text-xs">
                                          {t.deadline}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                        Tidak ada detail tugas spesifik untuk periode ini
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: SOP INPUT REVISI & OVERDUE ─── */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border p-6 shadow-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <PlayCircle className="size-5 text-amber-500" />
              Panduan Standar Operasional Input Revisi & Overdue
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pedoman untuk tim kreatif & developer dalam mencatat revisi dan mengelola status tugas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                1. Standar Status Revision (Revisi)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Pilih status <b>"Revisions"</b> saat ada masukan atau perbaikan dari klien atau PM. Cantumkan catatan nomor putaran revisi (misal: R1, R2) pada kolom komentar tugas.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-500" />
                2. Penanganan Tugas Overdue (Terlambat)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Tugas otomatis ditandai sebagai Overdue jika tanggal akhir (deadline) telah lewat dan status belum "Done". Segera koordinasikan dengan Project Manager untuk perpanjangan jadwal resmi.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Info className="size-4 text-blue-500" />
                3. Dokumentasi & Lampiran
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Selalu unggah tautan hasil pekerjaan atau file revisi pada tab referensi/lampiran sebelum mengubah status kembali ke <b>"In Review"</b> atau <b>"Done"</b>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
