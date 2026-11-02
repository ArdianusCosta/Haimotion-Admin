import { PieChart } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export function ProjectOverview({ data }: { data: any }) {
  const { language } = useLanguage()
  const isId = language === 'id'
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <PieChart className="size-5 text-orange-600" />
        </div>
        <div>
          <h2 className="font-semibold text-base">{isId ? 'Progress Proyek (Overview)' : 'Project Progress (Overview)'}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{isId ? 'Status project saat ini' : 'Current project status'}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2 pt-4 pb-2 overflow-x-auto gap-4">
        {(() => {
          const totalProjects = data.kpis.totalProjects.value || 1;
          const pendingCount = data.pipeline.find((p: any) => p.status === 1)?._count.status || 0;
          const activeCount = data.pipeline.find((p: any) => p.status === 2)?._count.status || 0;
          const reviewCount = data.pipeline.find((p: any) => p.status === 6)?._count.status || 0;
          const completedCount = data.pipeline.find((p: any) => p.status === 5)?._count.status || 0;
          const holdCount = data.pipeline.find((p: any) => p.status === 0)?._count.status || 0;

          return [
            { label: isId ? 'Menunggu' : 'Pending', count: pendingCount, value: Math.round((pendingCount/totalProjects)*100), color: 'var(--chart-4)' },
            { label: isId ? 'Aktif' : 'Active', count: activeCount, value: Math.round((activeCount/totalProjects)*100), color: 'var(--primary)' },
            { label: isId ? 'Dalam Review' : 'In Review', count: reviewCount, value: Math.round((reviewCount/totalProjects)*100), color: 'var(--chart-3)' },
            { label: isId ? 'Selesai' : 'Completed', count: completedCount, value: Math.round((completedCount/totalProjects)*100), color: 'var(--chart-1)' },
            { label: isId ? 'Ditunda' : 'On Hold', count: holdCount, value: Math.round((holdCount/totalProjects)*100), color: 'var(--chart-5)' },
          ];
        })().map((stage, idx) => (
          <div key={idx} className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative size-20">
              <svg className="size-20 rotate-[-90deg]">
                <circle className="text-secondary stroke-current" strokeWidth="5" cx="40" cy="40" r="34" fill="transparent"></circle>
                <circle 
                  className="stroke-current transition-all duration-1000 ease-in-out" 
                  strokeWidth="5" 
                  strokeDasharray={34 * 2 * Math.PI}
                  strokeDashoffset={(34 * 2 * Math.PI) - ((stage.value / 100) * (34 * 2 * Math.PI))}
                  strokeLinecap="round" 
                  cx="40" cy="40" r="34" fill="transparent" 
                  style={{ color: stage.color }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{stage.value}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{stage.label}</p>
              <p className="text-xs text-muted-foreground">{stage.count} {isId ? 'proyek' : 'project'}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
