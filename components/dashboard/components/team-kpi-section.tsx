'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useKpiPerformance } from '@/hooks/use-kpi-performance'
import { MemberKpi, ProjectKpiDetail } from '@/app/actions/dashboard-kpi'
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp, Trophy, Medal,
  Award, Users, FolderKanban, Target, ChevronDown, ChevronUp,
  BarChart3, Flame, Star
} from 'lucide-react'
import { PROJECT_STATUS_LABELS } from './utils'

// ─── Sub-component: Global KPI Cards ────────────────────────────────────────
function TeamKpiCards({ data }: { data: any }) {
  const { globalKpi } = data

  const cards = [
    {
      label: 'Total Tasks',
      value: globalKpi.totalTasks,
      icon: FolderKanban,
      bg: 'bg-primary/10 text-primary',
      iconBg: 'bg-primary'
    },
    {
      label: 'Selesai',
      value: globalKpi.completedTasks,
      icon: CheckCircle2,
      bg: 'bg-emerald-500/10 text-emerald-600',
      iconBg: 'bg-emerald-500'
    },
    {
      label: 'In Progress',
      value: globalKpi.inProgressTasks,
      icon: Clock,
      bg: 'bg-blue-500/10 text-blue-600',
      iconBg: 'bg-blue-500'
    },
    {
      label: 'Overdue',
      value: globalKpi.overdueTasks,
      icon: AlertCircle,
      bg: 'bg-rose-500/10 text-rose-600',
      iconBg: 'bg-rose-500'
    },
    {
      label: 'Completion Rate',
      value: `${globalKpi.completionRate}%`,
      icon: TrendingUp,
      bg: 'bg-violet-500/10 text-violet-600',
      iconBg: 'bg-violet-500'
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`size-12 rounded-xl flex items-center justify-center ${c.iconBg} text-white shadow-sm mb-3`}>
            <c.icon className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{c.label}</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sub-component: Score Badge ───────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
    : score >= 40 ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-600 bg-rose-500/10 border-rose-500/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color}`}>
      {score}
    </span>
  )
}

// ─── Sub-component: Rank Badge ───────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center justify-center size-8 rounded-full bg-amber-400/20 border border-amber-400/40">
      <Trophy className="size-4 text-amber-500" />
    </div>
  )
  if (rank === 2) return (
    <div className="flex items-center justify-center size-8 rounded-full bg-slate-300/20 border border-slate-400/40">
      <Medal className="size-4 text-slate-400" />
    </div>
  )
  if (rank === 3) return (
    <div className="flex items-center justify-center size-8 rounded-full bg-orange-400/20 border border-orange-400/40">
      <Award className="size-4 text-orange-500" />
    </div>
  )
  return (
    <div className="flex items-center justify-center size-8 rounded-full bg-muted">
      <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
    </div>
  )
}

// ─── Sub-component: Podium (Top 3) ──────────────────────────────────────────
function LeaderboardPodium({ members, periodLabel }: { members: MemberKpi[]; periodLabel: string }) {
  const top3 = members.slice(0, 3)
  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = [
    top3[1],  // 2nd place (left)
    top3[0],  // 1st place (center)
    top3[2],  // 3rd place (right)
  ]
  const heights = ['h-24', 'h-32', 'h-20']
  const podiumColors = [
    'bg-slate-200/60 border-slate-300/60 dark:bg-slate-700/40 dark:border-slate-600/40',
    'bg-amber-400/20 border-amber-400/40',
    'bg-orange-300/20 border-orange-400/40',
  ]
  const badgeIcons = [
    <Medal className="size-5 text-slate-400" key="medal" />,
    <Trophy className="size-6 text-amber-500" key="trophy" />,
    <Award className="size-5 text-orange-500" key="award" />,
  ]

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Star className="size-4 text-amber-500 fill-amber-500" />
        <h3 className="font-semibold text-sm text-foreground">Top Performer</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-6">{periodLabel}</p>

      {top3.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          Belum ada data leaderboard
        </div>
      ) : (
        <div className="flex items-end justify-center gap-3">
          {podiumOrder.map((member, i) => {
            if (!member) return <div key={i} className="w-[90px]" />
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3
            return (
              <div key={member.id} className="flex flex-col items-center gap-2">
                {/* Avatar + badge */}
                <div className="relative">
                  <Avatar className={`${rank === 1 ? 'size-14 ring-2 ring-amber-400' : 'size-11 ring-1 ring-border'} shadow-md`}>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1">
                    {badgeIcons[i]}
                  </div>
                </div>

                {/* Name + score */}
                <div className="text-center max-w-[80px]">
                  <p className="text-xs font-semibold text-foreground leading-tight truncate">{member.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{member.completionRate}% done</p>
                </div>

                {/* Podium block */}
                <div className={`w-20 ${heights[i]} rounded-t-lg border ${podiumColors[i]} flex items-center justify-center`}>
                  <span className="text-lg font-black text-foreground/60">#{rank}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sub-component: Full Leaderboard Table ──────────────────────────────────
function LeaderboardTable({ members }: { members: MemberKpi[] }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h3 className="font-semibold text-base">Leaderboard Lengkap</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground w-12">#</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Anggota</th>
              <th className="px-5 py-3 text-center font-medium text-muted-foreground">Selesai</th>
              <th className="px-5 py-3 text-center font-medium text-muted-foreground">Total</th>
              <th className="px-5 py-3 text-center font-medium text-muted-foreground">Overdue</th>
              <th className="px-5 py-3 text-center font-medium text-muted-foreground">Rate</th>
              <th className="px-5 py-3 text-center font-medium text-muted-foreground">Skor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Tidak ada data untuk periode ini
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className={`hover:bg-muted/30 transition-colors ${member.rank <= 3 ? 'bg-muted/10' : ''}`}>
                  <td className="px-5 py-3">
                    <RankBadge rank={member.rank} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-muted-foreground">{member.projectCount} project</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center font-semibold text-emerald-600">{member.completed}</td>
                  <td className="px-5 py-3 text-center text-muted-foreground">{member.totalAssigned}</td>
                  <td className="px-5 py-3 text-center">
                    {member.overdue > 0 ? (
                      <span className="text-rose-500 font-medium">{member.overdue}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${member.completionRate >= 70 ? 'bg-emerald-500' : member.completionRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${member.completionRate}%` }}
                        />
                      </div>
                      <span className="font-medium w-10 text-right">{member.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <ScoreBadge score={member.performanceScore} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Sub-component: Team Performance Cards ───────────────────────────────────
function TeamPerformanceCards({ members }: { members: MemberKpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {members.length === 0 ? (
        <div className="col-span-full h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
          <Users className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Tidak ada data anggota</p>
          <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah ada aktivitas dalam periode ini</p>
        </div>
      ) : (
        members.map((member) => {
          const completionColor = member.completionRate >= 70 ? 'bg-emerald-500'
            : member.completionRate >= 40 ? 'bg-amber-500'
            : 'bg-rose-500'

          return (
            <div key={member.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="size-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.rank <= 3 && (
                      <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-card flex items-center justify-center border border-border">
                        {member.rank === 1 && <Trophy className="size-3 text-amber-500" />}
                        {member.rank === 2 && <Medal className="size-3 text-slate-400" />}
                        {member.rank === 3 && <Award className="size-3 text-orange-500" />}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.projectCount} project</p>
                  </div>
                </div>
                <ScoreBadge score={member.performanceScore} />
              </div>

              {/* Completion rate bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold text-foreground">{member.completionRate}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${completionColor} rounded-full transition-all duration-700`}
                    style={{ width: `${member.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Selesai', value: member.completed, color: 'text-emerald-600' },
                  { label: 'Progress', value: member.inProgress, color: 'text-blue-600' },
                  { label: 'Overdue', value: member.overdue, color: 'text-rose-500' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center rounded-lg bg-muted/40 py-3">
                    <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Sub-component: Project Breakdown ────────────────────────────────────────
function ProjectBreakdown({ projects }: { projects: ProjectKpiDetail[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (projects.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
        <FolderKanban className="size-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">Tidak ada project</p>
        <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah ada project dengan task dalam periode ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const isOpen = expanded === project.id
        const statusConf = PROJECT_STATUS_LABELS[project.status] || PROJECT_STATUS_LABELS[1]

        return (
          <div key={project.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Project header row */}
            <button
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setExpanded(isOpen ? null : project.id)}
            >
              {/* Name + client */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground truncate">{project.name}</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.color}`}>
                    {statusConf.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm">
                <div className="text-center">
                  <p className="font-bold text-foreground">{project.totalTasks}</p>
                  <p className="text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-emerald-600">{project.completedTasks}</p>
                  <p className="text-muted-foreground">Selesai</p>
                </div>
                <div className="text-center">
                  {project.overdueTasks > 0
                    ? <p className="font-bold text-rose-500">{project.overdueTasks}</p>
                    : <p className="font-bold text-muted-foreground">0</p>
                  }
                  <p className="text-muted-foreground">Overdue</p>
                </div>
              </div>

              {/* Completion rate bar */}
              <div className="hidden md:flex items-center gap-2 w-[130px] shrink-0">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${project.completionRate >= 70 ? 'bg-emerald-500' : project.completionRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${project.completionRate}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-10 text-right">{project.completionRate}%</span>
              </div>

              {/* Expand icon */}
              <div className="shrink-0 text-muted-foreground">
                {isOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
              </div>
            </button>

            {/* Expanded: member contributions */}
            {isOpen && (
              <div className="border-t border-border px-5 py-4 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Kontribusi Anggota
                </p>
                {project.memberContributions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada data assignee</p>
                ) : (
                  <div className="space-y-3">
                    {project.memberContributions.map((m) => {
                      const memberRate = m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0
                      return (
                        <div key={m.userId} className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            <AvatarImage src={m.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {m.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                              <p className="text-xs text-muted-foreground shrink-0 ml-2">{m.completed}/{m.assigned}</p>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${memberRate >= 70 ? 'bg-emerald-500' : memberRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${memberRate}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-foreground w-10 text-right shrink-0">{memberRate}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main: TeamKpiSection ─────────────────────────────────────────────────────
interface TeamKpiSectionProps {
  range: string
  projectFilter: string
}

export function TeamKpiSection({ range, projectFilter }: TeamKpiSectionProps) {
  const [memberFilter, setMemberFilter] = useState('Semua Anggota')
  const [activeTab, setActiveTab] = useState<'team' | 'leaderboard' | 'projects'>('team')

  const { loading, isFetching, data, error } = useKpiPerformance(range, projectFilter, memberFilter)

  const tabs = [
    { key: 'team', label: 'Produktivitas Tim', icon: Users },
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'projects', label: 'Per Project', icon: FolderKanban },
  ] as const

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center gap-3 min-h-[300px]">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat data KPI tim...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center gap-3 min-h-[300px]">
        <AlertCircle className="size-8 text-rose-500" />
        <p className="text-sm text-muted-foreground text-center">
          {error || 'Gagal memuat data KPI tim.'}
        </p>
      </div>
    )
  }

  const filteredMembers = memberFilter !== 'Semua Anggota'
    ? data.memberKpis.filter(m => m.id.toString() === memberFilter)
    : data.memberKpis

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground">KPI Produktivitas Tim</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Periode: <span className="font-medium text-foreground">{data.periodLabel}</span>
              {isFetching && <span className="ml-2 text-primary animate-pulse">· Memperbarui...</span>}
            </p>
          </div>
        </div>

        {/* Member filter */}
        <Select value={memberFilter} onValueChange={(v) => setMemberFilter(v ?? 'Semua Anggota')}>
          <SelectTrigger className="w-[180px] h-9 text-xs bg-background">
            <SelectValue placeholder="Semua Anggota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua Anggota">Semua Anggota</SelectItem>
            {data.allUsers.map(u => (
              <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global KPI Summary Cards */}
      <TeamKpiCards data={data} />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'team' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="size-4 text-orange-500" />
            <h3 className="font-semibold text-sm text-foreground">Produktivitas Anggota Tim</h3>
          </div>
          <TeamPerformanceCards members={filteredMembers} />
        </section>
      )}

      {activeTab === 'leaderboard' && (
        <section className="space-y-5">
          {/* Score formula info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground flex gap-3">
            <Target className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Formula Penilaian</p>
              <p>Skor = (Completion Rate × 50%) + (Workload Score × 30%) + (Ketepatan Waktu × 20%)</p>
              <p className="mt-1">Tie-break: Completion Rate → Tepat Waktu → Total Task → Nama</p>
            </div>
          </div>

          {/* Podium for top 3 */}
          {filteredMembers.length >= 2 && (
            <LeaderboardPodium members={filteredMembers} periodLabel={data.periodLabel} />
          )}

          {/* Full leaderboard table */}
          <LeaderboardTable members={filteredMembers} />
        </section>
      )}

      {activeTab === 'projects' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Performa per Project</h3>
          </div>
          <ProjectBreakdown projects={data.projectBreakdowns} />
        </section>
      )}
    </div>
  )
}
