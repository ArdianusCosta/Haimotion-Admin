'use client'

import { Clock, Activity, Folder, UserCheck, MessageSquare, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RecentActivitiesCardProps {
  data: any
}

export function RecentActivitiesCard({ data }: RecentActivitiesCardProps) {
  const activities = data.recentActivity || []

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-foreground">Recent Activities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Aktivitas terbaru tim & pembaruan tugas</p>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto max-h-[330px] pr-1 space-y-3 divide-y divide-border/40">
        {activities.length > 0 ? (
          activities.map((act: any, idx: number) => {
            const initials = act.user
              ? act.user.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
              : 'U'

            return (
              <div key={act.id || idx} className="pt-3 first:pt-0 flex items-start gap-3 group">
                <Avatar className="size-9 ring-1 ring-border shrink-0 mt-0.5 shadow-2xs overflow-hidden">
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
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium whitespace-nowrap">
                      {act.timeAgo || 'Baru saja'}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>

                  {act.projectName && act.projectName !== 'General' && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        <Folder className="size-2.5" />
                        Project: {act.projectName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Clock className="size-7 mb-2 opacity-50" />
            <p className="text-xs font-medium">Belum ada aktivitas terbaru</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">Log aktivitas akan tercatat otomatis saat ada pembaruan</p>
          </div>
        )}
      </div>
    </div>
  )
}
