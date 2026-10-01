'use client'

import { useQuery } from '@tanstack/react-query'
import { getCrmActivities } from '@/app/actions/crm'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Activity, Target, Briefcase, GitPullRequest, CalendarCheck, FileText, CheckCircle2 } from 'lucide-react'

const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

export function CrmActivitiesPage() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['crmActivities'],
    queryFn: async () => {
      const res = await getCrmActivities()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const getActivityIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('lead')) return <Target className="h-4 w-4 text-blue-500" />
    if (lowerType.includes('client')) return <Briefcase className="h-4 w-4 text-primary" />
    if (lowerType.includes('deal')) return <GitPullRequest className="h-4 w-4 text-amber-500" />
    if (lowerType.includes('follow-up')) return <CalendarCheck className="h-4 w-4 text-rose-500" />
    if (lowerType.includes('note')) return <FileText className="h-4 w-4 text-purple-500" />
    if (lowerType.includes('completed')) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return <Activity className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Activities</h2>
      </div>
      
      <p className="text-muted-foreground">Recent actions and updates across your CRM.</p>

      <div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-xl">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-12 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No recent activities found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative border-l ml-5 space-y-6">
            {activities?.map((activity: any) => (
              <div key={activity.id} className="relative pl-6">
                <div className="absolute -left-[18px] top-1 h-9 w-9 rounded-full bg-background border-2 border-muted flex items-center justify-center overflow-hidden">
                  {activity.user?.avatar ? (
                    <img src={activity.user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-[10px] font-semibold">
                      {activity.user?.firstname?.[0]}
                    </AvatarFallback>
                  )}
                </div>
                
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {activity.user?.firstname} {activity.user?.lastname}
                        </span>
                        <span className="text-muted-foreground text-sm flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-full">
                          {getActivityIcon(activity.type)}
                          {activity.type}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap" title={formatDate(new Date(activity.created_at))}>
                        {formatDistanceToNow(new Date(activity.created_at))}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                      {activity.description}
                    </p>
                    
                    {(activity.client || activity.lead || activity.deal) && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        {activity.client && (
                          <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {activity.client.company_name}
                          </span>
                        )}
                        {activity.lead && (
                          <span className="text-[11px] font-medium bg-blue-500/10 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1">
                            <Target className="h-3 w-3" /> {activity.lead.name}
                          </span>
                        )}
                        {activity.deal && (
                          <span className="text-[11px] font-medium bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md flex items-center gap-1">
                            <GitPullRequest className="h-3 w-3" /> {activity.deal.title}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
