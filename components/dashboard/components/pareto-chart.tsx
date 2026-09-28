import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { PARETO_COLORS } from './utils'
import { useLanguage } from '@/components/language-provider'

export function ParetoChart({ data }: { data: any }) {
  const { t } = useLanguage()
  const totalPareto = data.paretoData?.reduce((acc: number, curr: any) => acc + curr.value, 0) || 1

  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base">{t('Analisis Pareto')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('Penyebab keterlambatan proyek')}</p>
        </div>
      </div>
      
      {data.paretoData && data.paretoData.length > 0 ? (
        <div className="mt-6 h-[250px] w-full flex items-center justify-between">
          <div className="w-1/2 h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paretoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.paretoData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PARETO_COLORS[index % PARETO_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold">100%</span>
              <span className="text-[9px] text-muted-foreground text-center leading-tight">Total<br/>keterlambatan</span>
            </div>
          </div>
          
          <div className="w-1/2 flex flex-col gap-3 pl-4">
            {data.paretoData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: PARETO_COLORS[idx % PARETO_COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-muted-foreground w-6 text-right">{Math.round((item.value/totalPareto)*100)}%</span>
                  <span className="font-medium text-foreground w-4 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-[250px] flex-col items-center justify-center text-center border border-dashed border-border rounded-lg">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart3 className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Tidak Ada Delay</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Selamat! Tidak ada keterlambatan yang berarti pada periode ini.</p>
        </div>
      )}
    </section>
  )
}
