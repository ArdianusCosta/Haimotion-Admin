import { Inbox, Calendar, CalendarDays, FolderDot, Filter, Plus } from 'lucide-react'
import { useTasks } from './tasks-provider'
import { Button } from '@/components/ui/button'

export function TasksSidebar({ onNewTask }: { onNewTask: () => void }) {
  const { 
    projects, 
    selectedTab, setSelectedTab,
    selectedProjectId, setSelectedProjectId,
    inboxCount, todayCount, upcomingCount
  } = useTasks()

  return (
    <div className="w-64 shrink-0 flex flex-col h-full border-r border-border/40 bg-card/30">
      <div className="p-4">
        <Button onClick={onNewTask} className="w-full justify-start shadow-sm font-medium h-10">
          <Plus className="mr-2 size-4" /> New Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6">
        <div className="space-y-6">
          
          {/* Main Filters */}
          <div>
            <h4 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Views</h4>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedTab('all'); setSelectedProjectId(null); }}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'all' && !selectedProjectId 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="size-4" />
                  <span>All Tasks</span>
                </div>
                {inboxCount > 0 && <span className="text-xs bg-background/50 rounded-md px-1.5 py-0.5">{inboxCount}</span>}
              </button>
              
              <button
                onClick={() => { setSelectedTab('my-tasks'); setSelectedProjectId(null); }}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'my-tasks' && !selectedProjectId 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Filter className="size-4" />
                  <span>My Tasks</span>
                </div>
              </button>
            </div>
          </div>

          {/* Projects */}
          <div>
            <h4 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projects</h4>
            <div className="space-y-1">
              {projects.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedProjectId === p.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderDot className={`size-4 shrink-0 ${selectedProjectId === p.id ? 'text-primary' : 'text-muted-foreground/70'}`} />
                    <span className="truncate">{p.name}</span>
                  </div>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground italic">No projects found.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
