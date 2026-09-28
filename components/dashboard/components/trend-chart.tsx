import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/components/language-provider'

export function TrendChart({ data, range, setRange }: { data: any, range: string, setRange: (v: string) => void }) {
  const { t } = useLanguage()
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({
    tasksCreated: false,
    tasksCompleted: false,
    projectsCreated: false,
    workHours: false
  })

  const toggleLine = (dataKey: string) => {
    setHiddenLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }))
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base">{t('Tren Performa')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('Perkembangan project, task dan jam kerja selama periode ini')}</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-background">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Last 30 days">30 Hari Terakhir</SelectItem>
            <SelectItem value="Last 6 months">6 Bulan Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {data.trendData.length > 0 ? (
        <div className="mt-6 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} tickLine={false} axisLine={false} />
              <YAxis tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                onClick={(e: any) => toggleLine(e.dataKey)}
                formatter={(value, entry, index) => <span className="text-xs cursor-pointer select-none hover:text-foreground text-muted-foreground transition-colors">{value}</span>}
              />
              <Line hide={hiddenLines.projectsCreated} type="monotone" dataKey="projectsCreated" name="Project" stroke="var(--primary)" strokeWidth={2} dot={{r:3}} activeDot={{r: 5}} />
              <Line hide={hiddenLines.tasksCompleted} type="monotone" dataKey="tasksCompleted" name="Task Selesai" stroke="var(--chart-1)" strokeWidth={2} dot={{r:3}} activeDot={{r: 5}} />
              <Line hide={hiddenLines.tasksCreated} type="monotone" dataKey="tasksCreated" name="Task Dibuat" stroke="var(--chart-4)" strokeWidth={2} dot={{r:3}} activeDot={{r: 5}} />
              <Line hide={hiddenLines.workHours} type="monotone" dataKey="workHours" name="Jam Kerja" stroke="var(--chart-3)" strokeWidth={2} dot={{r:3}} activeDot={{r: 5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex h-[250px] items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Belum ada data trend untuk periode ini.</p>
        </div>
      )}
    </section>
  )
}
