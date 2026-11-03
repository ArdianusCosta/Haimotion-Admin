'use client'

import { useRouter } from 'next/navigation'
import { Clock, Activity, Folder, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/components/language-provider'

interface RecentActivitiesCardProps {
  data: any
}

export function RecentActivitiesCard({ data }: RecentActivitiesCardProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const isId = language === 'id'

  const activities = (data?.recentActivity || []).filter((act: any) => {
    const typeLower = (act.type || '').toLowerCase()
    const descLower = (act.description || '').toLowerCase()
    return (
      !typeLower.includes('login') &&
      !typeLower.includes('logout') &&
      !descLower.includes('logged in') &&
      !descLower.includes('logged out')
    )
  })

  const handleNavigate = (act: any) => {
    const url = act.targetUrl || (act.projectId ? `/project/${act.projectId}` : act.taskId ? '/tasks' : '/projects')
    if (url) {
      router.push(url)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-foreground">{isId ? 'Aktivitas Terkini' : 'Recent Activities'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{isId ? 'Aktivitas terbaru tim & pembaruan tugas' : 'Latest team activity & task updates'}</p>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto max-h-[330px] pr-1 space-y-1 divide-y divide-border/30">
        {activities.length > 0 ? (
          activities.map((act: any, idx: number) => {
            const initials = act.user
              ? act.user.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
              : 'U'

            return (
              <div 
                key={act.id || idx} 
                onClick={() => handleNavigate(act)}
                className="pt-2 first:pt-0 flex items-start gap-3 group p-2.5 -mx-2 rounded-xl hover:bg-muted/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/60 hover:shadow-2xs"
                title={isId ? 'Klik untuk membuka perubahan ini' : 'Click to view this change'}
              >
                <Avatar className="size-9 ring-1 ring-border shrink-0 mt-0.5 shadow-2xs overflow-hidden group-hover:ring-primary/40 transition-all">
                  {act.avatar ? (
                    <AvatarImage src={act.avatar} alt={act.user} className="object-cover size-full" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {act.user}
                      {act.role && act.role !== 'Team Member' && act.role !== '--' && (
                        <span className="text-[11px] font-normal text-muted-foreground ml-1.5">
                          ({act.role})
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium whitespace-nowrap group-hover:text-foreground transition-colors">
                      {act.timeAgo || (isId ? 'Baru saja' : 'Just now')}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/80 mt-1 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors">
                    {act.description}
                  </p>

                  <div className="flex items-center justify-between mt-1.5">
                    {act.projectName && act.projectName !== 'General' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Folder className="size-2.5" />
                        {isId ? 'Proyek' : 'Project'}: {act.projectName}
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                      <span>{isId ? 'Buka' : 'Open'}</span>
                      <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Clock className="size-7 mb-2 opacity-50" />
            <p className="text-xs font-medium">{isId ? 'Belum ada aktivitas terbaru' : 'No recent activities yet'}</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">{isId ? 'Log aktivitas akan tercatat otomatis saat ada pembaruan' : 'Activity logs are recorded automatically on updates'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
