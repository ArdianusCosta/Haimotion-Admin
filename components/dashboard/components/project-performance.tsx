import { PROJECT_STATUS_LABELS } from './utils'
import { FolderKanban } from 'lucide-react'

export function ProjectPerformance({ data }: { data: any }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <FolderKanban className="size-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-semibold text-base">Performa Project</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Project dengan progres dan status terkini</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {data.projectPerformance.map((p: any, idx: number) => {
              const statusConf = PROJECT_STATUS_LABELS[p.status] || PROJECT_STATUS_LABELS[1]
              return (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground truncate max-w-[140px]">{p.name}</p>
                  </td>
                  <td className="py-3 w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-semibold w-10 text-right">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.color}`}>
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
