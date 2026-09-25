import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, ChevronUp, Monitor, Globe, FileText } from "lucide-react"
import { ActivityLog } from '@/types/activity-log'

interface ActivityLogItemProps {
  log: ActivityLog
  isExpanded: boolean
  onToggle: () => void
}

export function ActivityLogItem({ log, isExpanded, onToggle }: ActivityLogItemProps) {
  return (
    <div 
      className="flex flex-col rounded-lg border transition-all hover:bg-muted/30 cursor-pointer overflow-hidden"
      onClick={onToggle}
    >
      <div className="flex items-start gap-4 p-4">
        <Avatar className="size-10 shrink-0 mt-1">
          <AvatarImage src={log.user?.avatar || ''} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {log.user?.firstname ? (log.user.firstname[0] + (log.user.lastname?.[0] || '')).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">
              {log.user?.firstname} {log.user?.lastname}
            </p>
            <div className="flex items-center text-muted-foreground">
              <span className="text-xs mr-2">{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.created_at))}</span>
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            <span className="font-semibold capitalize text-foreground">{log.activity_type}</span> - {log.description}
          </p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-muted/30 p-4 pt-2 border-t text-sm space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5" /> Full Description
              </p>
              <p className="text-foreground pl-5">{log.description}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3.5" /> IP Address
              </p>
              <p className="text-foreground font-mono text-xs pl-5">{log.ip_address || '127.0.0.1 (Local / Unknown)'}</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Monitor className="size-3.5" /> User Agent
              </p>
              <p className="text-foreground font-mono text-xs pl-5">{log.user_agent || 'Mozilla/5.0 (Unknown Browser)'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
