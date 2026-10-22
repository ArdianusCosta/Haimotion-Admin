import { useRouter } from 'next/navigation'
import { FolderKanban, CheckCircle2, Clock, AlertCircle, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export function KpiCards({ data }: { data: any }) {
  const router = useRouter()
  
  const kpis = [
    {
      label: 'Total Project',
      value: data.kpis.totalProjects.value,
      prev: data.kpis.totalProjects.prev,
      icon: FolderKanban,
      color: 'bg-primary/10 text-primary',
      iconBg: 'bg-primary',
      link: '/projects'
    },
    {
      label: 'Task Selesai',
      value: data.kpis.tasksCompleted.value,
      prev: data.kpis.tasksCompleted.prev,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-600',
      iconBg: 'bg-emerald-500',
      link: '/tasks'
    },
    {
      label: 'Task Pending',
      value: data.kpis.tasksPending.value,
      prev: data.kpis.tasksPending.prev,
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-600',
      iconBg: 'bg-blue-500',
      link: '/tasks'
    },
    {
      label: 'Task Overdue',
      value: data.kpis.tasksOverdue.value,
      prev: data.kpis.tasksOverdue.prev,
      icon: AlertCircle,
      color: 'bg-rose-500/10 text-rose-600',
      iconBg: 'bg-rose-500',
      link: '/tasks'
    },
    {
      label: 'Completion Rate',
      value: data.kpis.completionRate.value + '%',
      prev: null,
      icon: TrendingUp,
      color: 'bg-violet-500/10 text-violet-600',
      iconBg: 'bg-violet-500',
      link: '/tasks'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => {
        const Arrow = kpi.prev && kpi.value >= kpi.prev ? ArrowUpRight : ArrowDownRight
        const isPositive = kpi.prev && kpi.value >= kpi.prev
        const change = kpi.prev ? Math.round(((Number(kpi.value.toString().replace(/\D/g,'')) - kpi.prev) / kpi.prev) * 100) : 0
        
        return (
          <div 
            key={idx} 
            onClick={() => router.push(kpi.link)}
            className="group rounded-xl border border-border bg-card p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`size-12 rounded-xl flex items-center justify-center ${kpi.iconBg} text-white shadow-sm`}>
                <kpi.icon className="size-6" />
              </div>
              {kpi.prev !== null && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                  <Arrow className="size-3" />
                  <span>{Math.abs(Number(change))}%</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              {kpi.prev !== null && (
                <p className="text-xs text-muted-foreground mt-2">vs. periode sebelumnya</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
