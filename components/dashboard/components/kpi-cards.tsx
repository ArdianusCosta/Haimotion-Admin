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
      color: 'bg-primary text-primary-foreground',
      link: '/projects'
    },
    {
      label: 'Task Selesai',
      value: data.kpis.tasksCompleted.value,
      prev: data.kpis.tasksCompleted.prev,
      icon: CheckCircle2,
      color: 'bg-chart-1 text-primary-foreground',
      link: '/tasks'
    },
    {
      label: 'Task Pending',
      value: data.kpis.tasksPending.value,
      prev: data.kpis.tasksPending.prev,
      icon: Clock,
      color: 'bg-chart-3 text-primary-foreground',
      link: '/tasks'
    },
    {
      label: 'Task Overdue',
      value: data.kpis.tasksOverdue.value,
      prev: data.kpis.tasksOverdue.prev,
      icon: AlertCircle,
      color: 'bg-destructive text-destructive-foreground',
      link: '/tasks'
    },
    {
      label: 'Completion Rate',
      value: data.kpis.completionRate.value + '%',
      prev: null,
      icon: TrendingUp,
      color: 'bg-chart-4 text-primary-foreground',
      link: '/tasks'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => {
        const Arrow = kpi.prev && kpi.value >= kpi.prev ? ArrowUpRight : ArrowDownRight
        const isPositive = kpi.prev && kpi.value >= kpi.prev
        const change = kpi.prev ? Math.round(((Number(kpi.value.toString().replace(/\D/g,'')) - kpi.prev) / kpi.prev) * 100) : 0
        
        return (
          <div 
            key={idx} 
            onClick={() => router.push(kpi.link)}
            className="rounded-xl border border-border bg-card p-4 shadow-sm cursor-pointer hover:bg-muted/40 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className={`size-10 rounded-xl flex items-center justify-center shadow-inner ${kpi.color}`}>
                <kpi.icon className="size-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{kpi.value}</p>
              
              {kpi.prev !== null && (
                <p className="mt-2 flex items-center gap-1 text-[11px]">
                  <Arrow className={`size-3 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`} />
                  <span className={`font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{Math.abs(Number(change))}%</span>
                  <span className="text-muted-foreground truncate">vs. bulan lalu</span>
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
