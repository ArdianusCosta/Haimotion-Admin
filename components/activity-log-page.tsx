'use client'

import { useState, useMemo } from "react"
import { useActivityLogs } from "@/hooks/use-activity-log"
import { ActivityLogList } from "@/components/activity-log/activity-log-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, X, Download, Activity, Users, LayoutGrid, Clock } from "lucide-react"

export function ActivityLogPage() {
  const { data: logs, isLoading, error } = useActivityLogs()
  const [search, setSearch] = useState("")
  const [filterUser, setFilterUser] = useState<string>("all")
  const [filterModule, setFilterModule] = useState<string>("all")

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    if (!logs) return []
    return logs.filter(log => {
      // Search logic
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        !search ||
        log.description.toLowerCase().includes(searchLower) ||
        log.activity_type.toLowerCase().includes(searchLower) ||
        log.user?.firstname?.toLowerCase().includes(searchLower) ||
        log.user?.lastname?.toLowerCase().includes(searchLower)

      // Filter logic
      const matchesUser = filterUser === "all" || log.user?.firstname === filterUser
      const moduleName = log.activity_type.split('_')[0].toLowerCase()
      const matchesModule = filterModule === "all" || moduleName === filterModule.toLowerCase()

      return matchesSearch && matchesUser && matchesModule
    })
  }, [logs, search, filterUser, filterModule])

  // Summary Metrics
  const summary = useMemo(() => {
    if (!logs) return { total: 0, today: 0, users: 0, modules: 0 }
    
    const today = new Date()
    const todayLogs = logs.filter(l => {
      const d = new Date(l.created_at)
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    })
    
    const uniqueUsers = new Set(logs.map(l => l.user_id))
    const uniqueModules = new Set(logs.map(l => l.activity_type.split('_')[0]))

    return {
      total: logs.length,
      today: todayLogs.length,
      users: uniqueUsers.size,
      modules: uniqueModules.size
    }
  }, [logs])

  // Unique lists for filters
  const uniqueUsersList = useMemo(() => {
    if (!logs) return []
    const users = new Map()
    logs.forEach(l => {
      if (l.user && !users.has(l.user_id)) {
        users.set(l.user_id, l.user.firstname)
      }
    })
    return Array.from(users.values())
  }, [logs])

  const uniqueModulesList = useMemo(() => {
    if (!logs) return []
    const modules = new Set(logs.map(l => {
      const m = l.activity_type.split('_')[0]
      return m.charAt(0).toUpperCase() + m.slice(1)
    }))
    return Array.from(modules)
  }, [logs])

  const clearFilters = () => {
    setFilterUser("all")
    setFilterModule("all")
    setSearch("")
  }

  const hasActiveFilters = filterUser !== "all" || filterModule !== "all"

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500 max-w-5xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
            <p className="text-muted-foreground mt-1">Monitor system activities and audit events across HaiMotion.</p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="space-y-8 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1 pt-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
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
    <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-1">Monitor system activities and audit events across HaiMotion.</p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Download className="size-4" /> Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 bg-card shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Activities</span>
          </div>
          <span className="text-2xl font-bold">{summary.total.toLocaleString()}</span>
        </div>
        <div className="border rounded-xl p-4 bg-card shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Today</span>
          </div>
          <span className="text-2xl font-bold">{summary.today.toLocaleString()}</span>
        </div>
        <div className="border rounded-xl p-4 bg-card shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Active Users</span>
          </div>
          <span className="text-2xl font-bold">{summary.users.toLocaleString()}</span>
        </div>
        <div className="border rounded-xl p-4 bg-card shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <LayoutGrid className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Modules</span>
          </div>
          <span className="text-2xl font-bold">{summary.modules.toLocaleString()}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search activities..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          
          <Popover>
            <PopoverTrigger className={`${buttonVariants({ variant: "outline" })} gap-2 bg-background shrink-0`}>
              <Filter className="size-4" /> 
              Filter
              {hasActiveFilters && <span className="flex size-2 rounded-full bg-primary" />}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filter Activities</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">User</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    {uniqueUsersList.map(u => (
                      <option key={String(u)} value={String(u)}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Module</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                  >
                    <option value="all">All Modules</option>
                    {uniqueModulesList.map(m => (
                      <option key={String(m)} value={String(m)}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t mt-4">
            <span className="text-xs text-muted-foreground mr-2 mt-3">Active filters:</span>
            <div className="flex flex-wrap gap-2 mt-3">
              {filterUser !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1 h-6 hover:bg-secondary">
                  User: {filterUser}
                  <X className="size-3 cursor-pointer hover:text-foreground" onClick={() => setFilterUser("all")} />
                </Badge>
              )}
              {filterModule !== "all" && (
                <Badge variant="secondary" className="gap-1 px-2 py-1 h-6 hover:bg-secondary">
                  Module: {filterModule}
                  <X className="size-3 cursor-pointer hover:text-foreground" onClick={() => setFilterModule("all")} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground">
                Clear all
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-background rounded-xl">
        <ActivityLogList logs={filteredLogs} />
      </div>
      
      {/* Temporary Debug Block */}
      {logs && logs.length > 0 && (
        <pre className="text-xs bg-muted p-4 mt-8 rounded-lg overflow-auto">
          DEBUG FIRST LOG: {JSON.stringify(logs[0], null, 2)}
        </pre>
      )}
    </div>
  )
}
