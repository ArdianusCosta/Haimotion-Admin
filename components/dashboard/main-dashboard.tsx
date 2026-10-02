'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboard } from '@/hooks/use-dashboard'
import { useLanguage } from '@/components/language-provider'
import { KpiCards } from './components/kpi-cards'
import { TrendChart } from './components/trend-chart'
import { ParetoChart } from './components/pareto-chart'
import { ProductionMonitoring } from './components/production-monitoring'
import { TeamPerformance } from './components/team-performance'
import { ProjectPerformance } from './components/project-performance'
import { ProjectOverview } from './components/project-overview'
import { RecentProjects } from './components/recent-projects'

export function MainDashboard({ user }: { user: any }) {
  const { range, setRange, projectFilter, setProjectFilter, loading, isFetching, data } = useDashboard()
  const { language } = useLanguage()
  
  const [greeting, setGreeting] = useState("Halo")
  const [dailyQuote, setDailyQuote] = useState("")

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    
    if (language === 'en') {
      if (hour >= 5 && hour < 12) setGreeting("Good Morning")
      else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon")
      else if (hour >= 17 && hour < 21) setGreeting("Good Evening")
      else setGreeting("Good Night")
    } else {
      if (hour >= 5 && hour < 11) setGreeting("Selamat Pagi")
      else if (hour >= 11 && hour < 15) setGreeting("Selamat Siang")
      else if (hour >= 15 && hour < 18) setGreeting("Selamat Sore")
      else setGreeting("Selamat Malam")
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
      "Ready to create something amazing today?",
      "One small step every day leads to big changes.",
      "Focus, execute, and achieve your goals today!",
      "Great ideas start with small actions. Let's begin!",
      "Make today productive and full of inspiration.",
      "Success is the result of preparation and dedication.",
      "Never give up! Every challenge is a new opportunity.",
      "Hard work never betrays the results. Keep it up!",
      "Maximize your potential and make real progress today.",
      "New day, new goals. Let's accomplish them remarkably!",
      "Focus on the process, the results will surely follow.",
      "Give your best today, and enjoy the results tomorrow."
    ]
    
    // Ganti quote setiap harinya berdasarkan tanggal
    const selectedQuotes = language === 'en' ? quotesEn : quotesId
    setDailyQuote(selectedQuotes[now.getDate() % selectedQuotes.length])
  }, [language])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading workspace data...</p>
        </div>
      </div>
    )
  }

  if (!data) return <div>Failed to load dashboard data.</div>

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}, {user?.firstname} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">{dailyQuote}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isFetching && (
            <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/20 animate-pulse">
              <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Memperbarui...</span>
            </div>
          )}

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[200px] h-10 bg-background">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Hari Ini</SelectItem>
              <SelectItem value="Last 7 days">7 Hari Terakhir</SelectItem>
              <SelectItem value="Last 30 days">30 Hari Terakhir</SelectItem>
              <SelectItem value="Last 3 months">3 Bulan Terakhir</SelectItem>
              <SelectItem value="Last 6 months">6 Bulan Terakhir</SelectItem>
              <SelectItem value="This year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-background">
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

      <KpiCards data={data} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <TrendChart data={data} range={range} setRange={setRange} />
        <ParetoChart data={data} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ProductionMonitoring data={data} />
        <TeamPerformance data={data} />
        <ProjectPerformance data={data} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectOverview data={data} />
        <RecentProjects data={data} />
      </div>

    </div>
  )
}
