'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboard } from '@/hooks/use-dashboard'
import { KpiCards } from './components/kpi-cards'
import { TrendChart } from './components/trend-chart'
import { ParetoChart } from './components/pareto-chart'
import { ProductionMonitoring } from './components/production-monitoring'
import { TeamPerformance } from './components/team-performance'
import { ProjectPerformance } from './components/project-performance'
import { ProjectOverview } from './components/project-overview'
import { RecentProjects } from './components/recent-projects'

export function MainDashboard({ user }: { user: any }) {
  const { range, setRange, projectFilter, setProjectFilter, loading, data } = useDashboard()

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
          <h1 className="text-2xl font-bold tracking-tight">Halo, {user?.firstname} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">Berikut adalah rangkuman performa dan aktivitas HaiMotion hari ini.</p>
        </div>
        
        <div className="flex items-center gap-3">
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
              {data.projectPerformance.map((p: any) => (
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
