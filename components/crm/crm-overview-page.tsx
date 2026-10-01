'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, Target, GitPullRequest, DollarSign } from 'lucide-react'
import { getCrmOverviewStats } from '@/app/actions/crm'
import { Skeleton } from '@/components/ui/skeleton'

export function CrmOverviewPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['crmStats'],
    queryFn: async () => {
      const res = await getCrmOverviewStats()
      if (!res.success) throw new Error(res.error)
      return res.data
    }
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">CRM Overview</h2>
        <p className="text-muted-foreground">Welcome to your Customer Relationship Management dashboard.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-[100px]" /> : (
              <div className="text-3xl font-bold">{statsData?.totalClients || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">In your database</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-[100px]" /> : (
              <div className="text-3xl font-bold">{statsData?.activeLeads || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Potential opportunities</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-full">
              <GitPullRequest className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-[100px]" /> : (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{statsData?.openDeals || 0}</div>
                <div className="text-sm text-muted-foreground">
                  (Est. ${statsData?.openDealsValue?.toLocaleString() || 0})
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">In the pipeline</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Today</CardTitle>
            <div className="p-2 bg-rose-500/10 rounded-full">
              <Activity className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-[100px]" /> : (
              <div className="text-3xl font-bold">{statsData?.followUpsToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Scheduled for today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent CRM activities yet.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You have no upcoming follow-ups.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
