import { useState } from 'react'
import { ActivityLog } from '@/types/activity-log'
import { ActivityLogItem } from './activity-log-item'

interface ActivityLogListProps {
  logs: ActivityLog[]
}

export function ActivityLogList({ logs }: ActivityLogListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No activities recorded yet.</p>
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <ActivityLogItem
          key={log.id}
          log={log}
          isExpanded={expandedId === log.id}
          onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
        />
      ))}
    </div>
  )
}
