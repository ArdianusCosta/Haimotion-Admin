import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users } from 'lucide-react'

export function TeamPerformance({ data }: { data: any }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Users className="size-5 text-violet-600" />
        </div>
        <div>
          <h2 className="font-semibold text-base">Kinerja Tim</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Produktivitas tim dalam 30 hari terakhir</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-muted-foreground">Tim</th>
              <th className="pb-3 text-center font-medium text-muted-foreground">Selesai</th>
              <th className="pb-3 text-center font-medium text-muted-foreground">Pending</th>
              <th className="pb-3 text-left font-medium text-muted-foreground">Utilisasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.teamPerformance.map((u: any, idx: number) => {
              const utilization = u.completed + u.pending > 0 ? Math.round((u.completed / (u.completed + u.pending)) * 100) : 0;
              return (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary font-medium">{u.name.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center font-semibold">{u.completed}</td>
                  <td className="py-3 text-center text-muted-foreground">{u.pending}</td>
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden w-16">
                        <div className="h-full bg-chart-1 rounded-full transition-all duration-500" style={{ width: `${utilization}%` }} />
                      </div>
                      <span className="font-semibold text-chart-1 w-10 text-right">{utilization}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
