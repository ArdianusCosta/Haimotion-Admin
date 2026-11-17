import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function getAvatarUrl(avatar: string | null | undefined) {
  if (!avatar) return ''
  if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar
  return `/avatars/${avatar}`
}

export function ProjectTeamKpi({ kpiData }: { kpiData: { userId: number; name: string; avatar: string; avatarUrl?: string; assigned: number; done: number }[] }) {
  if (!kpiData || !kpiData.length) {
    return <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No team members assigned</div>
  }

  const sorted = [...kpiData].sort((a,b) => b.assigned - a.assigned).slice(0, 5)
  const maxVal = Math.max(...sorted.map(d => d.assigned), 1)

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((d, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex w-44 sm:w-52 items-center gap-3 shrink-0 min-w-0">
             <Avatar className="size-8 shrink-0 min-w-8 min-h-8 aspect-square rounded-full border border-primary/20 bg-primary/10">
               {d.avatarUrl && <AvatarImage src={getAvatarUrl(d.avatarUrl)} alt={d.name} />}
               <AvatarFallback className="text-xs font-bold text-primary bg-primary/10 flex items-center justify-center">
                 {d.avatar}
               </AvatarFallback>
             </Avatar>
             <span className="text-sm font-medium truncate min-w-0" title={d.name}>{d.name}</span>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-2 border-l border-border/50 pl-3 sm:pl-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-blue-500 font-semibold w-[60px]">Assigned</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(d.assigned / maxVal) * 100}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{d.assigned}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-500 font-semibold w-[60px]">Done</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(d.done / maxVal) * 100}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{d.done}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
