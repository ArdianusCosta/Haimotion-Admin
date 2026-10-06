import { ActivityLog } from '@/types/activity-log'
import { ActivityLogItem } from './activity-log-item'
import { Activity } from 'lucide-react'

interface ActivityLogListProps {
  logs: ActivityLog[]
}

function isToday(date: Date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

function isYesterday(date: Date) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
}

function formatDateHeader(dateString: string) {
  const date = new Date(dateString)
  if (isToday(date)) return "TODAY"
  if (isYesterday(date)) return "YESTERDAY"
  
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date).toUpperCase()
}

export function ActivityLogList({ logs }: ActivityLogListProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Activity className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">No activities found</h3>
        <p className="text-muted-foreground text-sm max-w-sm mt-1">
          Try adjusting your search or filters. System activity will appear here as users work across HaiMotion.
        </p>
      </div>
    )
  }

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const header = formatDateHeader(log.created_at)
    if (!acc[header]) acc[header] = []
    acc[header].push(log)
    return acc
  }, {} as Record<string, ActivityLog[]>)

  return (
    <div className="space-y-8 pl-1">
      {Object.entries(groupedLogs).map(([header, groupLogs]) => (
        <div key={header} className="space-y-4">
          <div className="flex items-center gap-4">
            <h4 className="text-xs font-bold tracking-wider text-muted-foreground shrink-0">{header}</h4>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="space-y-0 relative">
            {groupLogs.map((log, index) => (
              <ActivityLogItem 
                key={log.id} 
                log={log} 
                isLast={index === groupLogs.length - 1 && Object.keys(groupedLogs)[Object.keys(groupedLogs).length - 1] === header} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
