import React, { useState } from 'react'
import { ProjectDonutChart } from './project-donut-chart'

const CHART_COLORS = [
  '#3b82f6','#ef4444','#f59e0b','#22c55e','#a855f7',
  '#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6',
]

export function TaskTypeCard({ detailTasks, isLoading }: { detailTasks: any[], isLoading: boolean }) {
  const [hidden, setHidden] = useState<string[]>([])
  const toggle = (label: string) => setHidden(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])
  
  const typeGroups: Record<string, number> = {}
  detailTasks.forEach((t: any) => {
    const k = t.type || 'General'
    typeGroups[k] = (typeGroups[k] || 0) + 1
  })
  
  const entries = Object.entries(typeGroups)
  const items = entries.map(([label, count], i) => ({
    label,
    count,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }))
  
  const visibleItems = items.filter(item => !hidden.includes(item.label))
  const visibleTotal = visibleItems.reduce((acc, curr) => acc + curr.count, 0)
  
  const segments = items.map(item => ({
    pct: !hidden.includes(item.label) && visibleTotal > 0 ? item.count / visibleTotal : 0,
    color: item.color
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-semibold text-foreground flex items-center gap-2">
          <span className="size-2 rounded-full bg-purple-500" />
          Task Type Distribution
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{detailTasks.length} tasks</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-8 px-2 sm:px-8">
        <div className="shrink-0">
          <ProjectDonutChart total={visibleTotal} segments={segments} />
        </div>
        <div className="w-full flex-1 max-h-[140px] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
              {isLoading ? 'Loading...' : 'No type data available.'}
            </p>
          ) : items.map((item) => {
            const isHidden = hidden.includes(item.label);
            return (
              <div 
                key={item.label} 
                onClick={() => toggle(item.label)}
                className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-colors ${isHidden ? 'border-transparent bg-muted/10 opacity-50' : 'border-border/50 bg-muted/20 hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: isHidden ? '#ccc' : item.color }} />
                  <span className="truncate text-sm font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-sm bg-background px-2 py-0.5 rounded-md border border-border/50">{item.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
