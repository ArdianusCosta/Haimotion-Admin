import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  Plus, Pencil, Trash, LogIn, LogOut, Upload, Download, 
  Shield, Activity, ChevronDown, ChevronUp, Monitor, Globe 
} from "lucide-react"
import { ActivityLog } from '@/types/activity-log'

function getSemanticDetails(activityType: string) {
  const typeLower = activityType.toLowerCase()
  
  let action = "performed an action"
  let module = "System"
  let color = "text-muted-foreground"
  let bgColor = "bg-muted"
  let Icon = Activity
  
  if (typeLower.includes('create') || typeLower.includes('add')) {
    action = "created"
    color = "text-emerald-500"
    bgColor = "bg-emerald-500/10"
    Icon = Plus
  } else if (typeLower.includes('update') || typeLower.includes('edit')) {
    action = "updated"
    color = "text-blue-500"
    bgColor = "bg-blue-500/10"
    Icon = Pencil
  } else if (typeLower.includes('delete') || typeLower.includes('remove')) {
    action = "deleted"
    color = "text-rose-500"
    bgColor = "bg-rose-500/10"
    Icon = Trash
  } else if (typeLower.includes('login')) {
    action = "logged in"
    color = "text-teal-500"
    bgColor = "bg-teal-500/10"
    Icon = LogIn
    module = "Authentication"
  } else if (typeLower.includes('logout')) {
    action = "logged out"
    color = "text-slate-500"
    bgColor = "bg-slate-500/10"
    Icon = LogOut
    module = "Authentication"
  } else if (typeLower.includes('upload')) {
    action = "uploaded"
    color = "text-indigo-500"
    bgColor = "bg-indigo-500/10"
    Icon = Upload
  } else if (typeLower.includes('download')) {
    action = "downloaded"
    color = "text-indigo-500"
    bgColor = "bg-indigo-500/10"
    Icon = Download
  } else if (typeLower.includes('permission') || typeLower.includes('role')) {
    action = "changed security settings"
    color = "text-amber-500"
    bgColor = "bg-amber-500/10"
    Icon = Shield
    module = "Security"
  }

  // Parse module from activityType like "Task_update" or "project_create"
  const parts = activityType.split('_')
  if (parts.length > 1 && !module.includes("Authentication") && !module.includes("Security")) {
    module = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  } else if (parts.length === 1 && !module.includes("Authentication") && !module.includes("Security")) {
    module = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }

  return { action, module, color, bgColor, Icon }
}

export function ActivityLogItem({ log, isLast }: { log: ActivityLog, isLast?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showTech, setShowTech] = useState(false)
  
  const { action, module, color, bgColor, Icon } = getSemanticDetails(log.activity_type)
  const isSecurity = module === "Security" || module === "Authentication"
  const isDestructive = action === "deleted"
  
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date(log.created_at))
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(log.created_at))

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="group relative flex gap-4 hover:bg-muted/30 p-2 -ml-2 rounded-lg transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
        {!isLast && (
          <div className="absolute left-[1.6rem] top-10 bottom-[-0.5rem] w-px bg-border group-hover:bg-border/80" />
        )}
        
        <div className="relative mt-1">
          <Avatar className="size-10 shrink-0 border bg-background">
            <AvatarImage src={log.user?.avatar || ''} className="object-cover" />
            <AvatarFallback className="bg-primary/5 text-primary text-xs">
              {log.user?.firstname ? (log.user.firstname[0] + (log.user.lastname?.[0] || '')).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-1 flex-col justify-center space-y-1 py-1 min-w-0 overflow-hidden">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-foreground/90 leading-snug truncate">
              <span className="font-semibold text-foreground mr-1.5">{log.user?.firstname || 'Unknown User'}</span>
              <span className="text-muted-foreground">{action}</span>
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 shrink-0">{time}</span>
          </div>

          <div className="text-sm font-medium truncate">
            {isSecurity && <Shield className="inline-block size-3.5 mr-1.5 text-amber-500 shrink-0" />}
            {log.description}
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap overflow-hidden">
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal shrink-0">
              {module}
            </Badge>
            {(log.project_id || log.task_id) && (
              <span className="text-xs text-muted-foreground truncate">
                {log.project_id ? `Project #${log.project_id}` : ''}
                {log.project_id && log.task_id ? ' · ' : ''}
                {log.task_id ? `Task #${log.task_id}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto overflow-x-hidden">
        <SheetHeader className="mb-6 px-6 pt-6">
          <SheetTitle className="flex items-center gap-2">
            <div className={`flex size-8 items-center justify-center rounded-full ${bgColor} ${color}`}>
              <Icon className="size-4" />
            </div>
            Activity Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <div className="flex items-start gap-4 text-left p-4 rounded-xl bg-muted/40 border">
            <Avatar className="size-12 border bg-background shadow-sm shrink-0 mt-0.5">
              <AvatarImage src={log.user?.avatar || ''} className="object-cover" />
              <AvatarFallback className="text-muted-foreground bg-muted">
                {log.user?.firstname ? log.user.firstname[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold text-foreground leading-snug break-words">
                {log.user?.firstname || 'Unknown User'}
              </p>
              <p className="text-xs text-muted-foreground break-words font-medium">
                {log.user?.lastname || 'HaiMotion User'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Action</p>
              <p className="font-medium capitalize flex items-center gap-1.5 text-foreground">
                <Icon className={`size-4 ${color}`} />
                {action}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Module</p>
              <div>
                <Badge variant="secondary" className="font-medium text-xs">{module}</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</p>
              <p className="font-medium text-foreground">{date}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Time</p>
              <p className="font-medium text-foreground">{time}</p>
            </div>
            {(log.project_id || log.task_id) && (
              <div className="col-span-2 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Related Entities</p>
                <div className="flex gap-2 flex-wrap">
                  {log.project_id && <Badge variant="outline">Project #{log.project_id}</Badge>}
                  {log.task_id && <Badge variant="outline">Task #{log.task_id}</Badge>}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Description</p>
            <div className={`p-3.5 rounded-lg text-sm break-words whitespace-pre-wrap ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-foreground border shadow-sm'}`}>
              {log.description}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden min-w-0 shadow-sm">
            <button 
              onClick={() => setShowTech(!showTech)} 
              className="flex w-full items-center justify-between p-3.5 bg-muted/30 hover:bg-muted/50 text-sm font-medium transition-colors"
            >
              Technical Details
              {showTech ? <ChevronUp className="size-4 text-muted-foreground shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
            </button>
            
            {showTech && (
              <div className="p-3.5 border-t space-y-4 bg-background overflow-hidden">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5 shrink-0" /> IP Address
                  </p>
                  <p className="text-sm font-mono text-foreground bg-muted/50 p-2 rounded-md break-all">{log.ip_address || 'Unknown'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Monitor className="size-3.5 shrink-0" /> User Agent
                  </p>
                  <p className="text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded-md break-all">{log.user_agent || 'Unknown'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
