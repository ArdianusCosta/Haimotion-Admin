import { FolderKanban } from 'lucide-react'

export function ProductionMonitoring({ data }: { data: any }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <FolderKanban className="size-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-base">Production Monitoring</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Progress produksi berdasarkan tahapan</p>
        </div>
      </div>
      
      <div className="flex flex-col justify-between flex-1 gap-4">
        {(() => {
          const totalProjects = data.kpis.totalProjects.value || 1;
          const pendingCount = data.pipeline.find((p: any) => p.status === 1)?._count.status || 0;
          const activeCount = data.pipeline.find((p: any) => p.status === 2)?._count.status || 0;
          const reviewCount = data.pipeline.find((p: any) => p.status === 6)?._count.status || 0;
          const completedCount = data.pipeline.find((p: any) => p.status === 5)?._count.status || 0;
          
          return [
            { label: 'Pending', value: pendingCount, total: totalProjects, color: 'bg-primary', textColor: 'text-primary' },
            { label: 'Active', value: activeCount, total: totalProjects, color: 'bg-chart-4', textColor: 'text-chart-4' },
            { label: 'In Review', value: reviewCount, total: totalProjects, color: 'bg-chart-3', textColor: 'text-chart-3' },
            { label: 'Completed', value: completedCount, total: totalProjects, color: 'bg-chart-1', textColor: 'text-chart-1' },
          ];
        })().map((stage, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-[130px] shrink-0">
              <div className={`size-8 rounded-lg flex items-center justify-center ${stage.color} text-white`}>
                <FolderKanban className="size-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{stage.label}</span>
            </div>
            <div className="flex-1">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${stage.color} rounded-full transition-all duration-500`} style={{ width: `${(stage.value/stage.total)*100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm w-[70px] justify-end shrink-0">
              <span className="text-muted-foreground">{stage.value}/{stage.total}</span>
              <span className={`font-semibold ${stage.textColor}`}>{Math.round((stage.value/stage.total)*100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
