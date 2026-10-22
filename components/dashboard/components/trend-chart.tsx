import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/components/language-provider'
import { TrendingUp } from 'lucide-react'

export function TrendChart({ data, range, setRange }: { data: any, range: string, setRange: (v: string) => void }) {
  const { t } = useLanguage()
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({
    tasksCreated: false,
    tasksCompleted: false,
    projectsCreated: false
  })

  const toggleLine = (dataKey: string) => {
    setHiddenLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }))
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base">{t('Tren Performa')}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('Perkembangan project dan task selama periode ini')}</p>
          </div>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-background">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Last 30 days">30 Hari Terakhir</SelectItem>
            <SelectItem value="Last 6 months">6 Bulan Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {data.trendData.length > 0 ? (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} 
                tickLine={false} 
                axisLine={false}
                dx={-10}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  borderColor: 'var(--border)', 
                  borderRadius: '12px', 
                  fontSize: '13px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: 'var(--foreground)', padding: '4px 0' }}
                labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '8px' }}
              />
              <Legend 
                verticalAlign="top" 
                height={40} 
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: '8px' }}
                onClick={(e: any) => toggleLine(e.dataKey)}
                formatter={(value, entry, index) => <span className="text-xs cursor-pointer select-none hover:text-foreground text-muted-foreground transition-colors px-2">{value}</span>}
              />
              <Line hide={hiddenLines.projectsCreated} type="monotone" dataKey="projectsCreated" name="Project" stroke="var(--primary)" strokeWidth={2.5} dot={{r:4}} activeDot={{r: 6, strokeWidth: 2 }} />
              <Line hide={hiddenLines.tasksCompleted} type="monotone" dataKey="tasksCompleted" name="Task Selesai" stroke="var(--chart-1)" strokeWidth={2.5} dot={{r:4}} activeDot={{r: 6, strokeWidth: 2 }} />
              <Line hide={hiddenLines.tasksCreated} type="monotone" dataKey="tasksCreated" name="Task Dibuat" stroke="var(--chart-4)" strokeWidth={2.5} dot={{r:4}} activeDot={{r: 6, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
          <TrendingUp className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Belum ada data trend</p>
          <p className="text-xs text-muted-foreground mt-1">Data akan muncul setelah ada aktivitas dalam periode ini</p>
        </div>
      )}
    </section>
  )
}
