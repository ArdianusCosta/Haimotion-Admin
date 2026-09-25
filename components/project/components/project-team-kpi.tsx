import React from 'react'

export function ProjectTeamKpi({ kpiData }: { kpiData: { userId: number; name: string; avatar: string; assigned: number; done: number }[] }) {
  if (!kpiData || !kpiData.length) {
    return <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No team members assigned</div>
  }

  const sorted = [...kpiData].sort((a,b) => b.assigned - a.assigned).slice(0, 5)
  const maxVal = Math.max(...sorted.map(d => d.assigned), 1)

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((d, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex w-36 items-center gap-3 shrink-0">
             <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
               {d.avatar}
             </div>
             <span className="text-sm font-medium truncate" title={d.name}>{d.name}</span>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-2 border-l border-border/50 pl-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-blue-500 font-semibold w-[60px]">Assigned</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(d.assigned / maxVal) * 100}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{d.assigned}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-500 font-semibold w-[60px]">Done</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(d.done / maxVal) * 100}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{d.done}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
