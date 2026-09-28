import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function TeamPerformance({ data }: { data: any }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-base">Kinerja Tim</h2>
          <p className="mt-1 text-xs text-muted-foreground">Produktivitas tim dalam 30 hari terakhir</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-muted-foreground">Tim</th>
              <th className="pb-3 text-center font-medium text-muted-foreground">Task Selesai</th>
              <th className="pb-3 text-center font-medium text-muted-foreground">Task Pending</th>
              <th className="pb-3 text-left font-medium text-muted-foreground">Utilisasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.teamPerformance.map((u: any, idx: number) => {
              const utilization = u.completed + u.pending > 0 ? Math.round((u.completed / (u.completed + u.pending)) * 100) : 0;
              return (
                <tr key={idx}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{u.name.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate max-w-[80px] text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center font-medium">{u.completed}</td>
                  <td className="py-3 text-center text-muted-foreground">{u.pending}</td>
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden w-10">
                        <div className="h-full bg-chart-1 rounded-full" style={{ width: `${utilization}%` }} />
                      </div>
                      <span className="font-medium text-chart-1 w-6">{utilization}%</span>
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
