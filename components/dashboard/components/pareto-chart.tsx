import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, CheckCircle2 } from 'lucide-react'
import { PARETO_COLORS } from './utils'
import { useLanguage } from '@/components/language-provider'

export function ParetoChart({ data }: { data: any }) {
  const { t } = useLanguage()
  const totalPareto = data.paretoData?.reduce((acc: number, curr: any) => acc + curr.value, 0) || 1

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
          <BarChart3 className="size-5 text-rose-600" />
        </div>
        <div>
          <h2 className="font-semibold text-base">{t('Analisis Pareto')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('Penyebab keterlambatan proyek')}</p>
        </div>
      </div>
      
      {data.paretoData && data.paretoData.length > 0 ? (
        <div className="h-[300px] w-full flex items-center justify-between">
          <div className="w-1/2 h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paretoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.paretoData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PARETO_COLORS[index % PARETO_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '12px', 
                    fontSize: '13px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground">100%</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight mt-0.5">Total<br/>keterlambatan</span>
            </div>
          </div>
          
          <div className="w-1/2 flex flex-col justify-center gap-3 pl-6">
            {data.paretoData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5 truncate pr-3 flex-1">
                  <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: PARETO_COLORS[idx % PARETO_COLORS.length] }} />
                  <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors" title={item.name}>{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground w-8 text-right">{Math.round((item.value/totalPareto)*100)}%</span>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center text-center rounded-lg border border-dashed border-border bg-muted/30">
          <div className="rounded-full bg-emerald-500/10 p-4 mb-4">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-foreground">Tidak Ada Delay</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">Selamat! Tidak ada keterlambatan yang berarti pada periode ini.</p>
        </div>
      )}
    </section>
  )
}
