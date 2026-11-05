'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar, Briefcase, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDashboard } from '@/hooks/use-dashboard'
import { useLanguage } from '@/components/language-provider'
import { KpiSummaryCards } from './components/kpi-summary-cards'
import { ProjectProgressTrends } from './components/project-progress-trends'
import { RecentActivitiesCard } from './components/recent-activities-card'
import { TeamKpiSection } from './components/team-kpi-section'
import { ProjectProgressDetails } from './components/project-progress-details'
import { ProjectDetailInspector } from './components/project-detail-inspector'
import { ParetoChart } from './components/pareto-chart'
import { ProductionMonitoring } from './components/production-monitoring'
import { ProjectOverview } from './components/project-overview'

export function MainDashboard({ user }: { user: any }) {
  const { range, setRange, projectFilter, setProjectFilter, loading, isFetching, data } = useDashboard()
  const { language } = useLanguage()

  const [greeting, setGreeting] = useState("Hi")
  const [dailyQuote, setDailyQuote] = useState("")
  const [selectedProject, setSelectedProject] = useState<any>(null)

  const isId = language === 'id'

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()

    if (isId) {
      if (hour >= 5 && hour < 12) setGreeting("Selamat Pagi")
      else if (hour >= 12 && hour < 17) setGreeting("Selamat Siang")
      else if (hour >= 17 && hour < 21) setGreeting("Selamat Sore")
      else setGreeting("Selamat Malam")
    } else {
      if (hour >= 5 && hour < 12) setGreeting("Good Morning")
      else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon")
      else if (hour >= 17 && hour < 21) setGreeting("Good Evening")
      else setGreeting("Good Night")
    }

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

    const quotesEn = [
      "Ready to create something extraordinary today?",
      "Small daily improvements accumulate into stunning results.",
      "Stay focused, execute with passion, and hit your goals!",
      "Great achievements always start with small actions. Let's build!",
      "Make today productive and full of creative inspiration.",
      "Success is the outcome of consistent preparation and dedication.",
      "Never give up! Every challenge is a stepping stone to mastery.",
      "Hard work always yields remarkable rewards. Keep going!",
      "Unleash your full potential and drive real progress today.",
      "New day, new milestones. Let's accomplish them with excellence!",
      "Focus on the craft; the results will naturally follow.",
      "Give your best today, and celebrate your achievements tomorrow."
    ]

    const quotes = isId ? quotesId : quotesEn
    setDailyQuote(quotes[now.getDate() % quotes.length])
  }, [language, isId])

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
          <p className="text-sm font-medium text-muted-foreground">
            {isId ? 'Memuat data dashboard workspace...' : 'Loading workspace dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className="p-6 text-sm text-destructive">
      {isId ? 'Gagal memuat data dashboard.' : 'Failed to load dashboard data.'}
    </div>
  )

  const userName = user?.firstname || user?.name?.split(' ')[0] || 'User'
  const userInitials = ((user?.firstname?.[0] || user?.name?.[0] || 'U') + (user?.lastname?.[0] || '')).toUpperCase()
  let avatarUrl = user?.avatar || ''
  if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
    avatarUrl = `/avatars/${avatarUrl}`
  }
  const userBio = user?.address?.trim() || user?.bio?.trim() || dailyQuote

  return (
    <div className="space-y-6 pb-12 w-full max-w-full min-w-0 overflow-hidden">
      {/* 1. HEADER SECTION (Profile & Greeting on left, Filter Controls on Far Right) */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          <Avatar className="size-14 sm:size-16 ring-2 ring-primary/20 border-2 border-background shadow-md shrink-0">
            <AvatarImage src={avatarUrl || undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground truncate">
              {greeting},{' '}
              <span className="text-primary">{userName}</span>{' '}
              👋
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 max-w-2xl leading-relaxed">
              {userBio}
            </p>
          </div>
        </div>

        {/* Filter Controls Pinned to Far Right (Responsive for mobile) */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto bg-card/70 backdrop-blur-md border border-border/70 p-1.5 px-2.5 rounded-2xl shadow-xs">
          {/* Periode Capsule */}
          <div className="flex items-center gap-1.5 bg-background/80 hover:bg-background border border-border/60 hover:border-border transition-all rounded-xl pl-2.5 pr-1 py-0.5 flex-1 sm:flex-initial">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground select-none shrink-0">
              {isId ? 'Periode:' : 'Period:'}
            </span>
            <Select value={range} onValueChange={(val: any) => val && setRange(val)}>
              <SelectTrigger className="h-7 w-full sm:w-[130px] md:w-[155px] border-0 bg-transparent shadow-none text-xs font-semibold focus:ring-0 focus-visible:ring-0 px-1 hover:text-primary transition-colors truncate">
                <SelectValue placeholder={isId ? 'Pilih Periode' : 'Select Period'} />
              </SelectTrigger>
              <SelectContent align="end" className="max-h-[340px] overflow-y-auto">
                <SelectItem value="All time">{isId ? 'Semua Periode' : 'All Time'}</SelectItem>
                <SelectItem value="Today">{isId ? 'Hari Ini' : 'Today'}</SelectItem>
                <SelectItem value="This month">{isId ? 'Bulan Ini' : 'This Month'}</SelectItem>
                <SelectItem value="Last month">{isId ? 'Bulan Lalu' : 'Last Month'}</SelectItem>
                <SelectItem value="Last 7 days">{isId ? '7 Hari Terakhir' : 'Last 7 Days'}</SelectItem>
                <SelectItem value="Last 30 days">{isId ? '30 Hari Terakhir' : 'Last 30 Days'}</SelectItem>
                <SelectItem value="Last 3 months">{isId ? '3 Bulan Terakhir' : 'Last 3 Months'}</SelectItem>
                <SelectItem value="Last 6 months">{isId ? '6 Bulan Terakhir' : 'Last 6 Months'}</SelectItem>
                <SelectItem value="This year">{isId ? 'Tahun Ini' : 'This Year'}</SelectItem>
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border/50 my-1 bg-muted/40 rounded-sm">
                  {isId ? 'Pilih Bulan Kalender' : 'Select Calendar Month'}
                </div>
                <SelectItem value="Month:9">{isId ? 'Oktober' : 'October'}</SelectItem>
                <SelectItem value="Month:8">{isId ? 'September' : 'September'}</SelectItem>
                <SelectItem value="Month:7">{isId ? 'Agustus' : 'August'}</SelectItem>
                <SelectItem value="Month:6">{isId ? 'Juli' : 'July'}</SelectItem>
                <SelectItem value="Month:5">{isId ? 'Juni' : 'June'}</SelectItem>
                <SelectItem value="Month:4">{isId ? 'Mei' : 'May'}</SelectItem>
                <SelectItem value="Month:3">{isId ? 'April' : 'April'}</SelectItem>
                <SelectItem value="Month:2">{isId ? 'Maret' : 'March'}</SelectItem>
                <SelectItem value="Month:1">{isId ? 'Februari' : 'February'}</SelectItem>
                <SelectItem value="Month:0">{isId ? 'Januari' : 'January'}</SelectItem>
                <SelectItem value="Month:10">{isId ? 'November' : 'November'}</SelectItem>
                <SelectItem value="Month:11">{isId ? 'Desember' : 'December'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Capsule */}
          <div className="flex items-center gap-1.5 bg-background/80 hover:bg-background border border-border/60 hover:border-border transition-all rounded-xl pl-2.5 pr-1 py-0.5 flex-1 sm:flex-initial">
            <Briefcase className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground select-none shrink-0">
              {isId ? 'Project:' : 'Project:'}
            </span>
            <Select value={projectFilter} onValueChange={(val: any) => val && setProjectFilter(val)}>
              <SelectTrigger className="h-7 w-full sm:w-[140px] md:w-[170px] border-0 bg-transparent shadow-none text-xs font-semibold focus:ring-0 focus-visible:ring-0 px-1 hover:text-primary transition-colors truncate">
                <SelectValue placeholder={isId ? 'Pilih Project' : 'Select Project'} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="Semua Project">{isId ? 'Semua Project' : 'All Projects'}</SelectItem>
                {(data?.allProjectsList || data?.projectPerformance || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button (only shown when filtered) */}
          {(range !== 'All time' || projectFilter !== 'Semua Project') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRange('All time')
                setProjectFilter('Semua Project')
              }}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl hover:bg-muted/60"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. TOP METRIC CARDS & STATUS RIBBON (Total Users, Total Projects, Total Tasks + 6 Status Badges) */}
      <KpiSummaryCards data={data} />

      {/* 3. ROW: PROJECT PROGRESS TRENDS & RECENT ACTIVITIES (Matches screenshot!) */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-w-0">
        <div className="min-w-0">
          <ProjectProgressTrends data={data} range={range} setRange={setRange} />
        </div>
        <div className="min-w-0">
          <RecentActivitiesCard data={data} />
        </div>
      </div>

      {/* 4. TEAM KPI & PRODUKTIVITAS TIM (Unified: Overview Grafik, Leaderboard, Kartu Performa, Distribusi Project) */}
      <TeamKpiSection data={data} range={range} projectFilter={projectFilter} />

      {/* 5. PROJECT PROGRESS DETAILS (Carousel of Donut Charts with Left/Right Navigation) */}
      <ProjectProgressDetails
        data={data}
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={(p) => setSelectedProject(p)}
      />

      {/* 6. PROJECT DETAIL INSPECTOR (Detailed status, platform breakdown for selected project) */}
      {selectedProject && <ProjectDetailInspector project={selectedProject} />}

      {/* 7. PARETO ANALYSIS & PRODUCTION MONITORING (Preserves Pareto & Pipeline as explicitly instructed) */}
      <div className="grid gap-6 xl:grid-cols-2 min-w-0">
        <div className="min-w-0">
          <ParetoChart data={data} />
        </div>
        <div className="min-w-0">
          <ProductionMonitoring data={data} />
        </div>
      </div>

      {/* 8. PROJECT OVERVIEW STAGES */}
      <ProjectOverview data={data} />
    </div>
  )
}
