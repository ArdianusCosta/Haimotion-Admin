'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useActivityLogs } from "@/hooks/use-activity-log"
import { ActivityLogList } from "@/components/activity-log/activity-log-list"
import { Skeleton } from "@/components/ui/skeleton"

export function ActivityLogPage() {
  const { data: logs, isLoading, error } = useActivityLogs()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">Monitor system activities across all modules.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>A list of recent actions performed by users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load activity logs.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">Monitor system activities across all modules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>A list of recent actions performed by users.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityLogList logs={logs || []} />
        </CardContent>
      </Card>
    </div>
  )
}
