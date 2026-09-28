import { FolderKanban } from 'lucide-react'

export function ProductionMonitoring({ data }: { data: any }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-base">Production Monitoring</h2>
          <p className="mt-1 text-xs text-muted-foreground">Progress produksi berdasarkan tahapan</p>
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
            { label: 'Pending', value: pendingCount, total: totalProjects, color: 'bg-primary' },
            { label: 'Active', value: activeCount, total: totalProjects, color: 'bg-chart-4' },
            { label: 'In Review', value: reviewCount, total: totalProjects, color: 'bg-chart-3' },
            { label: 'Completed', value: completedCount, total: totalProjects, color: 'bg-chart-1' },
          ];
        })().map((stage, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center gap-3 w-[120px] shrink-0">
              <div className={`size-6 rounded-md flex items-center justify-center ${stage.color} text-primary-foreground`}>
                <FolderKanban className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${stage.color} rounded-full`} style={{ width: `${(stage.value/stage.total)*100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs w-[60px] justify-end shrink-0">
              <span className="text-muted-foreground">{stage.value}/{stage.total}</span>
              <span className="font-medium">{Math.round((stage.value/stage.total)*100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
