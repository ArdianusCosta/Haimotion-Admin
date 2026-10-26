'use client'

import { useState, useMemo } from 'react'
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
  AlertTriangle,
  PlayCircle,
  Info,
  CheckCircle2,
  Clock,
  RotateCcw,
  ListTodo,
  Trophy,
  Medal,
  Award,
  Eye,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Star,
  ExternalLink,
  Users2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface TeamRevisionChartProps {
  data: any
}

export function TeamRevisionChart({ data }: TeamRevisionChartProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [filterMode, setFilterMode] = useState<'active' | 'all'>('all')
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'all' | '30days' | '3months' | 'year'>('all')
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({})

  const rawTeamData: any[] = data?.teamAssignments || []

  // Filter between active current team members and everyone
  const filteredData = useMemo(() => {
    if (filterMode === 'active') {
      const activeOnly = rawTeamData.filter(m => !m.isResigned)
      return activeOnly.length > 0 ? activeOnly : rawTeamData
    }
    return rawTeamData
  }, [rawTeamData, filterMode])

  // Summary Metrics calculated directly from live DB data
  const metrics = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.totalAssigned += curr.assigned || 0
        acc.totalDone += curr.done || 0
        acc.totalInProgress += curr.inProgress || 0
        acc.totalRevised += curr.revised || 0
        return acc
      },
      { totalAssigned: 0, totalDone: 0, totalInProgress: 0, totalRevised: 0 }
    )
  }, [filteredData])

  // Leaderboard ranking list (sorted by assigned tasks desc, matching Screenshot 2)
  const rankedMembers = useMemo(() => {
    const list = [...rawTeamData]
    return list.sort((a, b) => {
      if (b.assigned !== a.assigned) {
        return b.assigned - a.assigned
      }
      return b.completionRate - a.completionRate
    })
  }, [rawTeamData])

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

  // Export / Print PDF
  const handleExportPdf = () => {
    window.print()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col space-y-5">
      {/* 1. Header Section (Matches Screenshot 1) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
              TEAM KPI (OVERVIEW KARYAWAN)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribusi tugas yang ditugaskan (Assigned) dan diselesaikan (Done) seluruh karyawan
            </p>
          </div>
        </div>

        {/* Filter Toggle & Mode Pills */}
        <div className="flex flex-wrap items-center gap-3">
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
              Tim Aktif ({rawTeamData.filter(m => !m.isResigned).length})
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
              Semua ({rawTeamData.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-semibold">Total Ditugaskan</span>
            <ListTodo className="size-3.5" />
          </div>
          <span className="text-xl font-bold text-foreground mt-1">
            {metrics.totalAssigned} <span className="text-xs font-normal text-muted-foreground">task</span>
          </span>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold">Tugas Selesai (Done)</span>
            <CheckCircle2 className="size-3.5" />
          </div>
          <span className="text-xl font-bold text-foreground mt-1">
            {metrics.totalDone} <span className="text-xs font-normal text-muted-foreground">task</span>
          </span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-semibold">Dalam Pengerjaan</span>
            <Clock className="size-3.5" />
          </div>
          <span className="text-xl font-bold text-foreground mt-1">
            {metrics.totalInProgress} <span className="text-xs font-normal text-muted-foreground">task</span>
          </span>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[11px] font-semibold">Putaran Revisi</span>
            <RotateCcw className="size-3.5" />
          </div>
          <span className="text-xl font-bold text-foreground mt-1">
            {metrics.totalRevised} <span className="text-xs font-normal text-muted-foreground">task</span>
          </span>
        </div>
      </div>

      {/* 3. Legend Indicator (Matching Screenshot 1) */}
      <div className="flex flex-wrap items-center justify-end gap-5 text-xs font-medium pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-xs bg-[#3b82f6]" />
          <span className="text-muted-foreground">Tasks Assigned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-xs bg-[#10b981]" />
          <span className="text-muted-foreground">Tasks Done</span>
        </div>
      </div>

      {/* 4. Dual Bar Chart (Overview of ALL employees with clean horizontal scroll) */}
      {filteredData.length > 0 ? (
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
          <div style={{ minWidth: filteredData.length > 8 ? `${filteredData.length * 60}px` : '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
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
                      <div className="bg-popover border border-border rounded-xl p-3 shadow-lg space-y-1.5 text-xs min-w-[210px]">
                        <div className="border-b border-border/60 pb-1.5 mb-1.5">
                          <p className="font-bold text-foreground text-sm">{item.fullName || item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{item.role}</p>
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
                />
                <Bar
                  dataKey="done"
                  name="Tasks Done"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <Users2 className="size-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">Belum ada data penugasan anggota tim untuk project/periode ini</p>
        </div>
      )}

      {/* 5. VIEW FULL LIST & RANKING BEST EMPLOYEE BUTTON (Matches Screenshot 1) */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs cursor-pointer"
        >
          <Eye className="size-4" />
          <span>VIEW FULL LIST & RANKING BEST EMPLOYEE</span>
        </button>
      </div>

      {/* 6. SOP Tutorial Banner */}
      <div
        onClick={() => setShowTutorial(true)}
        className="flex items-center justify-center gap-2 p-2.5 bg-muted/40 hover:bg-muted/70 border border-border rounded-xl cursor-pointer text-muted-foreground hover:text-foreground transition-all text-xs font-medium group"
      >
        <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
        <span>Panduan SOP: Cara & Standar Input Revisi / Overdue</span>
        <PlayCircle className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* ─── MODAL 1: LAPORAN TEAM KPI & RANKING BEST EMPLOYEE (Screenshot 2) ─── */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-border">
          {/* Header Banner */}
          <div className="bg-linear-to-r from-amber-600 to-amber-700 text-white p-4 sm:p-5 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="size-6 text-amber-200" />
              <div>
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  Team KPI — All Projects (Best Employee Guideline)
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5">
                  Pedoman penilaian kinerja dan peringkat karyawan terbaik
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Top Toolbar: Filter & Star Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground">Periode:</span>
                <select
                  value={leaderboardPeriod}
                  onChange={(e: any) => setLeaderboardPeriod(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua Waktu (All Time)</option>
                  <option value="30days">Bulan Ini (30 Hari Terakhir)</option>
                  <option value="3months">3 Bulan Terakhir</option>
                  <option value="year">Tahun Ini</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                <span>Pedoman Penilaian Employee of the Month</span>
              </div>
            </div>

            {/* Document Title Header */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                Laporan Team KPI & Ranking Best Employee
              </h2>
              <p className="text-xs text-muted-foreground">
                Agregasi Seluruh Project • Dibuat pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Table (Screenshot 2) */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-14 text-center">RANK</th>
                      <th className="py-3 px-4">TEAM MEMBER</th>
                      <th className="py-3 px-4 text-center w-24">ASSIGNED</th>
                      <th className="py-3 px-4 text-center w-24">DONE</th>
                      <th className="py-3 px-4 w-44">COMPLETION</th>
                      <th className="py-3 px-4 text-center w-16">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rankedMembers.map((member, idx) => {
                      const rank = idx + 1
                      const isFirst = rank === 1

                      return (
                        <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                          {/* Rank Column */}
                          <td className="py-3 px-4 text-center">
                            {isFirst ? (
                              <span className="inline-flex items-center justify-center gap-1 bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-xs">
                                🏆 #{rank}
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">
                                #{rank}
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center font-bold text-xs bg-amber-700/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                                #{rank}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-semibold">
                                #{rank}
                              </span>
                            )}
                          </td>

                          {/* Member Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9 border border-border">
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
                                    <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                      ★ BEST EMPLOYEE
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {member.role || 'Creative Staff'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Column */}
                          <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {member.assigned}
                          </td>

                          {/* Done Column */}
                          <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {member.done}
                          </td>

                          {/* Completion Bar Column */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    member.completionRate >= 90
                                      ? 'bg-amber-600 dark:bg-amber-500'
                                      : member.completionRate >= 70
                                      ? 'bg-emerald-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(member.completionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {member.completionRate}% Complete
                              </span>
                            </div>
                          </td>

                          {/* Action Column */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMember(member)
                              }}
                              title="Lihat Detail Rincian Tugas & Project"
                              className="size-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors shadow-2xs"
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
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: DETAIL BREAKDOWN PROYEK & TUGAS PER KARYAWAN (Screenshot 3) ─── */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border border-border">
          {selectedMember && (
            <div>
              {/* Header */}
              <div className="border-b border-border p-4 sm:p-5 bg-card sticky top-0 z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    Team KPI Breakdown — {selectedMember.fullName || selectedMember.name}
                  </h3>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* User Profile Card (Matches Screenshot 3) */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-14 border border-border shadow-xs">
                      <AvatarImage src={selectedMember.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                        {selectedMember.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-foreground">
                        {selectedMember.fullName || selectedMember.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold px-2">
                          Employee
                        </Badge>
                        {selectedMember.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            ✉️ {selectedMember.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      size="sm"
                      onClick={() => handleExportCsv(selectedMember)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-xs"
                    >
                      <FileSpreadsheet className="size-3.5" />
                      <span>Export Excel</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleExportPdf}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-xs"
                    >
                      <FileText className="size-3.5" />
                      <span>Export PDF</span>
                    </Button>
                  </div>
                </div>

                {/* Sub-header & 3 Summary Cards */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FolderKanban className="size-4 text-primary" />
                    Team KPI — Projects & Tasks Breakdown
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-border rounded-xl p-3.5 text-center bg-card">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">TOTAL PROJECTS</p>
                      <p className="text-2xl font-black text-foreground mt-1">
                        {selectedMember.projectCount || (selectedMember.projects || []).length}
                      </p>
                    </div>

                    <div className="border border-border rounded-xl p-3.5 text-center bg-card">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">TASKS (DONE/TOTAL)</p>
                      <p className="text-2xl font-black text-foreground mt-1">
                        {selectedMember.done} / {selectedMember.assigned}
                      </p>
                    </div>

                    <div className="border border-border rounded-xl p-3.5 text-center bg-card">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">OVERALL KPI</p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {selectedMember.completionRate}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Projects & Tasks Accordions (Screenshot 3) */}
                <div className="space-y-3">
                  {(selectedMember.projects || []).length > 0 ? (
                    (selectedMember.projects || []).map((prj: any) => {
                      const isExpanded = expandedProjects[prj.id] ?? true

                      return (
                        <div key={prj.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                          {/* Accordion Header */}
                          <div
                            onClick={() => toggleProject(prj.id)}
                            className="p-3.5 bg-muted/30 hover:bg-muted/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                                On-Progress
                              </Badge>
                              <span className="font-bold text-xs sm:text-sm text-foreground">
                                {prj.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {prj.completedTasks}/{prj.totalTasks} Tasks ({prj.completionRate}%)
                              </span>
                              <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div className="h-1 w-full bg-muted">
                            <div
                              className="h-full bg-amber-600 dark:bg-amber-500 transition-all duration-300"
                              style={{ width: `${Math.min(prj.completionRate, 100)}%` }}
                            />
                          </div>

                          {/* Expanded Task List Table */}
                          {isExpanded && (
                            <div className="p-0 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-muted/20 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider border-b border-border/60">
                                  <tr>
                                    <th className="py-2.5 px-4">Nama Tugas</th>
                                    <th className="py-2.5 px-4 text-center w-28">Status</th>
                                    <th className="py-2.5 px-4 text-right w-32">Deadline</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                  {(prj.tasks || []).map((t: any) => (
                                    <tr key={t.id} className="hover:bg-muted/20">
                                      <td className="py-2.5 px-4">
                                        <div className="space-y-0.5">
                                          <p className="font-semibold text-foreground text-xs">{t.name}</p>
                                          {t.pillar && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                                              🏷️ {t.pillar}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-4 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                          t.status === 5
                                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                            : t.status === 6 || t.status === 2
                                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                            : t.status === 4
                                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                          {t.statusLabel}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">
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
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: SOP INPUT REVISI & OVERDUE ─── */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-xl">
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
