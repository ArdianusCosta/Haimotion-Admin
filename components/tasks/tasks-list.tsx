import { useTasks, TaskTab } from './tasks-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CheckCircle2, Circle, Clock, MessageSquare, MoreHorizontal, Calendar, FolderDot, User as UserIcon, ListFilter, ArrowDownAZ, Search, LayoutGrid } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TASK_STATUS_MAP } from '@/types/tasks'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/types/tasks'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export function TasksList({ onEditTask }: { onEditTask: (task: Task) => void }) {
  const { 
    filteredTasks, loading, projects,
    handleToggleTaskStatus, handleStatusChange,
    changeStatusMutation, toggleStatusMutation,
    selectedTask, setSelectedTask, setTaskDetailsOpen,
    selectedTab, setSelectedTab, searchQuery, setSearchQuery,
    selectedProjectId, setSelectedProjectId,
    setTaskToDelete, setDeleteDialogOpen
  } = useTasks()
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        document.getElementById('task-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="space-y-2 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 p-2.5 animate-in fade-in duration-500">
              <Skeleton className="size-[18px] rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const tabs: { id: TaskTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'my-tasks', label: 'My Tasks' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'due-soon', label: 'Due Soon' }
  ]

  const todayStr = new Date().toISOString().split('T')[0]
  
  const getNextWeekStr = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split('T')[0]
  }
  const nextWeekStr = getNextWeekStr()

  const tasksToday = filteredTasks.filter(t => t.dueDate === todayStr && t.status !== 5)
  const tasksThisWeek = filteredTasks.filter(t => t.dueDate > todayStr && t.dueDate <= nextWeekStr && t.status !== 5)
  const tasksLater = filteredTasks.filter(t => (!t.dueDate || t.dueDate > nextWeekStr) && t.status !== 5)
  const tasksOverdue = filteredTasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 5)
  const tasksCompleted = filteredTasks.filter(t => t.status === 5)

  const renderGroup = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null

    return (
      <div className="mb-8">
        <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">{title}</h3>
        <div className="space-y-1">
          {tasks.map(task => (
            <div 
              key={task.id}
              onClick={() => { setSelectedTask(task); setTaskDetailsOpen(true); }}
              className={`group flex items-start gap-4 rounded-xl border border-transparent p-3.5 transition-all hover:bg-card hover:border-border/60 hover:shadow-sm cursor-pointer ${
                selectedTask?.id === task.id ? 'bg-card border-border/60 shadow-sm' : ''
              } ${task.status === 5 ? 'opacity-50 hover:opacity-100 bg-muted/20' : ''}`}
            >
              <div className="flex items-center self-start pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleTaskStatus(task)
                  }}
                  disabled={toggleStatusMutation.isPending}
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border border-border/80 text-transparent transition-all hover:border-primary hover:text-primary disabled:opacity-50 ${task.status === 5 ? 'border-primary bg-primary text-primary-foreground' : ''}`}
                >
                  <CheckCircle2 className="size-3" />
                </button>
              </div>
              
              <div className="flex flex-1 flex-col min-w-0 gap-1 mt-0.5">
                <p className={`text-[15px] font-medium truncate transition-colors ${task.status === 5 ? 'text-muted-foreground line-through' : 'text-foreground group-hover:text-primary'}`}>
                  {task.title}
                </p>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground/80">
                  {task.projectName && (
                    <span className="flex items-center gap-1.5 transition-colors group-hover:text-foreground/80">
                      {task.projectName}
                    </span>
                  )}
                  {task.projectName && <span className="opacity-30 text-[8px]">•</span>}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      onClick={(e) => e.stopPropagation()}
                      disabled={changeStatusMutation.isPending}
                      className={`flex items-center gap-1.5 transition-colors hover:text-foreground outline-none ${
                        task.status === 8 ? 'text-destructive/90' :
                        task.status === 2 || task.status === 6 ? 'text-blue-500/90' :
                        task.status === 7 ? 'text-orange-500/90' : ''
                      } disabled:opacity-50`}
                    >
                      {task.status === 1 || task.status === 0 ? <Circle className="size-3" /> : 
                       task.status === 2 || task.status === 6 ? <Clock className="size-3" /> :
                       task.status === 5 ? <CheckCircle2 className="size-3" /> :
                       <Circle className="size-3 fill-current" />}
                      <span className="text-[11px] font-semibold">{TASK_STATUS_MAP[task.status] || 'Unknown'}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40 text-xs">
                      {Object.entries(TASK_STATUS_MAP).map(([val, label]) => (
                        <DropdownMenuItem 
                          key={val} 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task, Number(val)); }}
                          className={`text-xs ${task.status === Number(val) ? 'bg-accent font-medium' : ''}`}
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {task.dueDate && (
                    <>
                      <span className="opacity-30 text-[8px]">•</span>
                      <span className={`flex items-center gap-1.5 text-[11px] ${
                        task.dueDate < todayStr && task.status !== 5 
                          ? 'text-destructive font-semibold bg-destructive/10 px-1.5 py-0.5 rounded-sm' 
                          : task.dueDate === todayStr 
                            ? 'text-orange-500/90 font-semibold' 
                            : ''
                      }`}>
                        {task.dueDate === todayStr ? 'Due today' : 
                         task.dueDate === nextWeekStr ? 'Due next week' : 
                         task.dueDate < todayStr && task.status !== 5 ? `Overdue · ${new Date(task.dueDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}` :
                         new Date(task.dueDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pr-2">
                {task.commentCount > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                    <MessageSquare className="size-3.5" /> {task.commentCount}
                  </div>
                )}
                
                {task.assignees.length > 0 && (
                  <div className="flex -space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    {task.assignees.map((a: any) => (
                      <Avatar key={a.id} className="size-[22px] border border-background">
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">{a.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
                
                <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={e => e.stopPropagation()} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:border hover:border-border/60 hover:shadow-sm hover:text-foreground transition-all outline-none">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs font-medium">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setTaskDetailsOpen(true); }}>
                        Open Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                        Edit Task
                      </DropdownMenuItem>
                      <div className="h-px bg-border/40 my-1" />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                        Assign to...
                      </DropdownMenuItem>
                      <div className="h-px bg-border/40 my-1" />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedTask(task);
                        setTaskToDelete(task.dbId);
                        setDeleteDialogOpen(true);
                      }}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Tabs Row */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-4 mb-4">
        <div className="bg-muted/30 p-1 rounded-lg inline-flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                selectedTab === tab.id 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Utility Row (Search, Filter, Sort) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            id="task-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks... (Press '/')"
            className="pl-9 pr-4 h-9 text-sm bg-card/50 hover:bg-card border-border/40 shadow-sm focus-visible:ring-1 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-muted/30 p-0.5 rounded-lg border border-border/40 mr-1 shadow-sm">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-background shadow-sm hover:bg-background text-foreground cursor-default">
              List
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground" onClick={() => router.push('/kanban')}>
              Board
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs border-border/40 shadow-sm bg-card hover:bg-accent hover:text-accent-foreground">
            <ListFilter className="size-3.5 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs border-border/40 shadow-sm bg-card hover:bg-accent hover:text-accent-foreground">
            <ArrowDownAZ className="size-3.5 mr-2" /> Sort
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 pb-10">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-12 p-8 border border-dashed border-border/60 rounded-2xl bg-card/20">
            {searchQuery || selectedTab !== 'all' ? (
              <>
                <Search className="size-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-semibold text-foreground">No tasks found</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Try adjusting your filters or search query.</p>
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedTab('all'); }} className="h-8 text-xs shadow-sm">
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4 mb-3">
                  <CheckCircle2 className="size-6 text-primary/80" />
                </div>
                <p className="text-sm font-semibold text-foreground">No tasks yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first task to start organizing your work.</p>
                {/* Note: In a real app we'd trigger the "New Task" function from props here. */}
              </>
            )}
          </div>
        ) : (
          <>
            {renderGroup('Overdue', tasksOverdue)}
            {renderGroup('Today', tasksToday)}
            {renderGroup('This Week', tasksThisWeek)}
            {renderGroup('Later', tasksLater)}
            {renderGroup('Completed', tasksCompleted)}
          </>
        )}
      </div>
    </div>
  )
}
