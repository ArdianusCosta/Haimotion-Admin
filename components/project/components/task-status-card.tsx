import React, { useState } from 'react'
import { ProjectDonutChart } from './project-donut-chart'

export function TaskStatusCard({ stats }: { stats: any }) {
  const [hidden, setHidden] = useState<string[]>([])
  const toggle = (label: string) => setHidden(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  const items = [
    { label: 'Pending',     color: '#6b7280', val: stats.pendingTasks, desc: 'Not started yet' },
    { label: 'In Progress', color: '#3b82f6', val: stats.inProgressTasks, desc: 'Currently working on' },
    { label: 'Done',        color: '#22c55e', val: stats.completedTasks, desc: 'Successfully completed' },
  ]
  
  const visibleItems = items.filter(item => !hidden.includes(item.label))
  const visibleTotal = visibleItems.reduce((acc, curr) => acc + curr.val, 0)
  
  const segments = items.map(item => ({
    pct: !hidden.includes(item.label) && visibleTotal > 0 ? item.val / visibleTotal : 0,
    color: item.color
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-semibold text-foreground flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500" />
          Task Status
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{stats.totalTasks} total tasks</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-8 px-2 sm:px-8">
        <div className="shrink-0 relative">
          <ProjectDonutChart total={visibleTotal} segments={segments} />
        </div>
        <div className="w-full flex-1 grid grid-cols-2 gap-4">
          {items.map(item => {
            const isHidden = hidden.includes(item.label);
            return (
              <div 
                key={item.label} 
                onClick={() => toggle(item.label)}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${isHidden ? 'border-transparent bg-muted/10 opacity-50' : 'border-border/50 bg-muted/20 hover:bg-muted/50'}`}
              >
                <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: isHidden ? '#ccc' : item.color }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{item.label}</span>
                    <span className="font-bold text-base ml-auto">{item.val}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
