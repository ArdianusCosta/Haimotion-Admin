import { PROJECT_STATUS_LABELS } from './utils'

export function ProjectPerformance({ data }: { data: any }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-base">Performa Project</h2>
          <p className="mt-1 text-xs text-muted-foreground">Project dengan progres dan status terkini</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-border">
            {data.projectPerformance.map((p: any, idx: number) => {
              const statusConf = PROJECT_STATUS_LABELS[p.status] || PROJECT_STATUS_LABELS[1]
              return (
                <tr key={idx}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground truncate max-w-[120px]">{p.name}</p>
                  </td>
                  <td className="py-3 w-[100px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-medium w-6 text-right">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusConf.color}`}>
                      {statusConf.label}
                    </span>
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
