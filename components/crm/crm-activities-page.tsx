'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCrmActivities } from '@/app/actions/crm'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Activity, Target, Briefcase, GitPullRequest, CalendarCheck, FileText, CheckCircle2, Zap, Search, Filter } from 'lucide-react'

const formatDistanceToNow = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

type ActivityIconConfig = {
  icon: any
  color: string
  bg: string
  dotColor: string
}

const getActivityConfig = (type: string): ActivityIconConfig => {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('lead')) return { icon: Target, color: 'text-sky-600', bg: 'bg-sky-500/10', dotColor: 'bg-sky-500' }
  if (lowerType.includes('client')) return { icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-500/10', dotColor: 'bg-violet-500' }
  if (lowerType.includes('deal')) return { icon: GitPullRequest, color: 'text-amber-600', bg: 'bg-amber-500/10', dotColor: 'bg-amber-500' }
  if (lowerType.includes('follow-up') || lowerType.includes('followup')) return { icon: CalendarCheck, color: 'text-rose-600', bg: 'bg-rose-500/10', dotColor: 'bg-rose-500' }
  if (lowerType.includes('note')) return { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-500/10', dotColor: 'bg-purple-500' }
  if (lowerType.includes('completed')) return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10', dotColor: 'bg-emerald-500' }
  return { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-500/10', dotColor: 'bg-slate-400' }
}

const CATEGORY_FILTERS = ['All', 'Leads', 'Clients', 'Deals', 'Follow-ups', 'Notes']

export function CrmActivitiesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const { data: activities, isLoading } = useQuery({
    queryKey: ['crmActivities'],
    queryFn: async () => {
      const res = await getCrmActivities(100)
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const filteredActivities = activities?.filter((act: any) => {
    const matchesSearch =
      act.description.toLowerCase().includes(search.toLowerCase()) ||
      act.type.toLowerCase().includes(search.toLowerCase()) ||
      (act.user?.firstname && `${act.user.firstname} ${act.user.lastname || ''}`.toLowerCase().includes(search.toLowerCase())) ||
      (act.client?.company_name && act.client.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (act.lead?.name && act.lead.name.toLowerCase().includes(search.toLowerCase())) ||
      (act.deal?.title && act.deal.title.toLowerCase().includes(search.toLowerCase()))

    let matchesCategory = true
    const typeLower = act.type.toLowerCase()
    if (category === 'Leads') matchesCategory = typeLower.includes('lead') || !!act.lead_id
    else if (category === 'Clients') matchesCategory = typeLower.includes('client') || !!act.client_id
    else if (category === 'Deals') matchesCategory = typeLower.includes('deal') || !!act.deal_id
    else if (category === 'Follow-ups') matchesCategory = typeLower.includes('follow-up') || typeLower.includes('followup')
    else if (category === 'Notes') matchesCategory = typeLower.includes('note')

    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground text-sm mt-1">Audit trail and recent actions recorded across your CRM.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-violet-500/10 text-violet-600 rounded-xl px-4 py-2 border border-violet-500/20">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-semibold">{activities?.length || 0} events recorded</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities or actors..."
            className="pl-9 bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1 shadow-sm">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="w-px flex-1 bg-border/50 mt-2" />
                </div>
                <div className="flex-1 pb-6">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/4 mb-3" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities?.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center h-52 text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Activity className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No activities found</p>
                <p className="text-sm text-muted-foreground mt-1">Actions on leads, clients, deals, and follow-ups will automatically appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {filteredActivities?.map((activity: any, index: number) => {
              const conf = getActivityConfig(activity.type)
              const Icon = conf.icon
              const isLast = index === (filteredActivities?.length || 0) - 1

              return (
                <div key={activity.id} className="flex gap-4">
                  {/* Left: Avatar + Connecting Line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full ${conf.bg} border-2 border-background ring-1 ring-border/50 flex items-center justify-center overflow-hidden shadow-sm`}>
                        {activity.user?.avatar ? (
                          <img src={activity.user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[11px] font-bold">
                            {activity.user?.firstname?.[0]}{activity.user?.lastname?.[0]}
                          </span>
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${conf.bg} border-2 border-background flex items-center justify-center`}>
                        <Icon className={`h-2.5 w-2.5 ${conf.color}`} />
                      </div>
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border/40 my-2" />}
                  </div>

                  {/* Right: Activity Content Card */}
                  <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-2'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">
                          {activity.user?.firstname} {activity.user?.lastname || ''}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${conf.bg} ${conf.color} border border-current/20`}>
                          <Icon className="h-3 w-3" />
                          {activity.type}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0" title={formatDate(new Date(activity.created_at))}>
                        {formatDistanceToNow(new Date(activity.created_at))}
                      </span>
                    </div>

                    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card/90">
                      <CardContent className="p-3.5">
                        <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                          {activity.description}
                        </p>

                        {(activity.client || activity.lead || activity.deal) && (
                          <div className="flex flex-wrap gap-2 pt-2.5 mt-2.5 border-t border-border/40">
                            {activity.client && (
                              <span className="text-[11px] font-medium bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-md flex items-center gap-1 border border-violet-500/20">
                                <Briefcase className="h-3 w-3" /> {activity.client.company_name}
                              </span>
                            )}
                            {activity.lead && (
                              <span className="text-[11px] font-medium bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-md flex items-center gap-1 border border-sky-500/20">
                                <Target className="h-3 w-3" /> {activity.lead.name}
                              </span>
                            )}
                            {activity.deal && (
                              <span className="text-[11px] font-medium bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-500/20">
                                <GitPullRequest className="h-3 w-3" /> {activity.deal.title}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
