'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, Target, GitPullRequest, TrendingUp, TrendingDown, ArrowUpRight, Zap, Star, ChevronRight } from 'lucide-react'
import { getCrmOverviewStats } from '@/app/actions/crm'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function CrmOverviewPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['crmStats'],
    queryFn: async () => {
      const res = await getCrmOverviewStats()
      if (!res.success) throw new Error(res.error)
      return res.data
    }
  })

  const stats = [
    {
      label: 'Total Clients',
      value: statsData?.totalClients || 0,
      subtitle: 'In your database',
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-500/10',
      color: 'text-violet-500',
      change: '+12%',
      up: true,
    },
    {
      label: 'Active Leads',
      value: statsData?.activeLeads || 0,
      subtitle: 'Potential opportunities',
      icon: Target,
      gradient: 'from-sky-500 to-blue-600',
      bg: 'bg-sky-500/10',
      color: 'text-sky-500',
      change: '+8%',
      up: true,
    },
    {
      label: 'Open Deals',
      value: statsData?.openDeals || 0,
      subtitle: `Est. Rp ${(statsData?.openDealsValue || 0).toLocaleString('id-ID')}`,
      icon: GitPullRequest,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      color: 'text-amber-500',
      change: '-2%',
      up: false,
    },
    {
      label: 'Follow-ups Today',
      value: statsData?.followUpsToday || 0,
      subtitle: 'Scheduled for today',
      icon: Activity,
      gradient: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-500/10',
      color: 'text-rose-500',
      change: '+5%',
      up: true,
    },
  ]

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-6 md:p-8 text-primary-foreground shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium opacity-80">Customer Relationship Management</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">CRM Overview</h1>
            <p className="mt-1 opacity-75 text-sm">Your complete customer relationship dashboard at a glance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
              <Star className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Performance Score</span>
              <span className="text-lg font-bold">87%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-muted-foreground">{stat.label}</CardTitle>
                <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {isLoading ? (
                  <Skeleton className="h-10 w-[80px] mb-1" />
                ) : (
                  <div className="text-4xl font-bold tracking-tight">{stat.value}</div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4 border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Latest actions in your CRM</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No recent CRM activities yet.</p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="col-span-3 border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Upcoming Tasks</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Your scheduled follow-ups</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">You have no upcoming follow-ups.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
