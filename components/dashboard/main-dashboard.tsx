'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboard } from '@/hooks/use-dashboard'
import { useLanguage } from '@/components/language-provider'
import { KpiSummaryCards } from './components/kpi-summary-cards'
import { ProjectProgressTrends } from './components/project-progress-trends'
import { RecentActivitiesCard } from './components/recent-activities-card'
import { TeamRevisionChart } from './components/team-revision-chart'
import { ProjectProgressDetails } from './components/project-progress-details'
import { ProjectDetailInspector } from './components/project-detail-inspector'
import { ParetoChart } from './components/pareto-chart'
import { ProductionMonitoring } from './components/production-monitoring'
import { ProjectOverview } from './components/project-overview'
import { TeamKpiSection } from './components/team-kpi-section'

export function MainDashboard({ user }: { user: any }) {
  const { range, setRange, projectFilter, setProjectFilter, loading, isFetching, data } = useDashboard()
  const { language } = useLanguage()

  const [greeting, setGreeting] = useState("Hi")
  const [dailyQuote, setDailyQuote] = useState("")
  const [selectedProject, setSelectedProject] = useState<any>(null)

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()

    if (hour >= 5 && hour < 12) setGreeting("Selamat Pagi")
    else if (hour >= 12 && hour < 17) setGreeting("Selamat Siang")
    else if (hour >= 17 && hour < 21) setGreeting("Selamat Sore")
    else setGreeting("Selamat Malam")

    const quotesId = [
      "Siap untuk menciptakan sesuatu yang luar biasa hari ini?",
      "Satu langkah kecil setiap hari akan membawa perubahan besar.",
      "Fokus, kerjakan, dan wujudkan targetmu hari ini!",
      "Ide hebat berawal dari tindakan kecil. Ayo mulai!",
      "Jadikan hari ini produktif dan penuh dengan inspirasi.",
      "Keberhasilan adalah hasil dari persiapan dan dedikasi.",
      "Pantang menyerah! Setiap tantangan adalah peluang baru.",
      "Kerja keras tidak pernah mengkhianati hasil. Tetap semangat!",
      "Ayo maksimalkan potensimu dan buat progres nyata hari ini.",
      "Hari baru, target baru. Mari selesaikan dengan luar biasa!",
      "Fokus pada proses, hasilnya pasti mengikuti. Semangat!",
      "Beri yang terbaik hari ini, dan nikmati hasilnya esok hari."
    ]

    setDailyQuote(quotesId[now.getDate() % quotesId.length])
  }, [language])

  // Automatically select the first project for the inspector
  useEffect(() => {
    if (data?.projectProgressDetails && data.projectProgressDetails.length > 0) {
      if (!selectedProject || !data.projectProgressDetails.some((p: any) => p.id === selectedProject.id)) {
        setSelectedProject(data.projectProgressDetails[0])
      }
    }
  }, [data, selectedProject])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Memuat data dashboard workspace...</p>
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-6 text-sm text-destructive">Gagal memuat data dashboard.</div>

  const userName = user?.name || `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || 'User'
  const userRoleOrDivision = user?.role?.name || user?.address || 'IT - Web Developer Staff'

  return (
    <div className="space-y-6 pb-12 max-w-full">
      {/* 1. HEADER SECTION (Greeting, Quote, and Filter Controls) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Hi, <span className="text-primary">{userName}</span>{' '}
              <span className="text-sm sm:text-base font-medium text-muted-foreground">
                ({userRoleOrDivision})
              </span>{' '}
              👋
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{dailyQuote}</p>
          </div>

          <div className="flex items-center gap-3">
            {isFetching && (
              <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-pulse">
                <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Sinkronisasi data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card border border-border p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Periode:</span>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-full sm:w-[170px] h-8 text-xs bg-background">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Hari Ini</SelectItem>
              <SelectItem value="Last 7 days">7 Hari Terakhir</SelectItem>
              <SelectItem value="Last 30 days">30 Hari Terakhir</SelectItem>
              <SelectItem value="Last 3 months">3 Bulan Terakhir</SelectItem>
              <SelectItem value="Last 6 months">6 Bulan Terakhir</SelectItem>
              <SelectItem value="This year">Tahun Ini</SelectItem>
              <SelectItem value="All time">Semua Periode</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden sm:block w-px h-5 bg-border" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Project:</span>
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-8 text-xs bg-background">
              <SelectValue placeholder="Pilih Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua Project">Semua Project</SelectItem>
              {(data.allProjectsList || data.projectPerformance || []).map((p: any) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS & STATUS RIBBON (Total Users, Total Projects, Total Tasks + 6 Status Badges) */}
      <KpiSummaryCards data={data} />

      {/* 3. ROW: PROJECT PROGRESS TRENDS & RECENT ACTIVITIES (Matches screenshot!) */}
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
        <ProjectProgressTrends data={data} range={range} setRange={setRange} />
        <RecentActivitiesCard data={data} />
      </div>

      {/* 4. TEAM REVISION OVERVIEW & ASSIGNMENTS (Grouped Bar Chart + Tutorial Video Banner) */}
      <TeamRevisionChart data={data} />

      {/* 5. PROJECT PROGRESS DETAILS (Carousel of Donut Charts with Left/Right Navigation) */}
      <ProjectProgressDetails
        data={data}
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={(p) => setSelectedProject(p)}
      />

      {/* 6. PROJECT DETAIL INSPECTOR (Detailed status, platform breakdown for selected project) */}
      {selectedProject && <ProjectDetailInspector project={selectedProject} />}

      {/* 7. PARETO ANALYSIS & PRODUCTION MONITORING (Preserves Pareto & Pipeline as explicitly instructed) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ParetoChart data={data} />
        <ProductionMonitoring data={data} />
      </div>

      {/* 8. PROJECT OVERVIEW STAGES */}
      <ProjectOverview data={data} />

      {/* 9. TEAM PRODUCTIVITY & LEADERBOARD SECTION */}
      <TeamKpiSection range={range} projectFilter={projectFilter} />
    </div>
  )
}
