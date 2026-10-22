import { useRouter } from 'next/navigation'
import { PROJECT_STATUS_LABELS } from './utils'
import { FolderPlus, ArrowRight } from 'lucide-react'

export function RecentProjects({ data }: { data: any }) {
  const router = useRouter()
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <FolderPlus className="size-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Project Terbaru</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Daftar project yang baru dibuat</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors" 
          onClick={() => router.push('/projects')}
        >
          Lihat semua
          <ArrowRight className="size-3.5" />
        </button>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-muted-foreground">Nama Project</th>
              <th className="pb-3 text-left font-medium text-muted-foreground">Client</th>
              <th className="pb-3 text-left font-medium text-muted-foreground">Deadline</th>
              <th className="pb-3 text-right font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.projectPerformance.slice(0, 5).map((p: any, idx: number) => {
              const statusConf = PROJECT_STATUS_LABELS[p.status] || PROJECT_STATUS_LABELS[1]
              return (
                <tr key={idx} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                  <td className="py-3">
                    <p className="font-medium text-foreground truncate max-w-[160px]">{p.name}</p>
                  </td>
                  <td className="py-3 text-muted-foreground truncate max-w-[110px]">{p.client}</td>
                  <td className="py-3 text-muted-foreground">
                    {p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                  </td>
                  <td className="py-3 text-right">
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
