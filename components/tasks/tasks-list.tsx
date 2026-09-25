import { useTasks, TaskTab } from './tasks-provider'
import { CheckCircle2, Circle, Clock, MessageSquare, MoreHorizontal, Calendar, FolderDot, User as UserIcon, ListFilter, ArrowDownAZ, Search } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TASK_STATUS_MAP } from '@/types/tasks'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/types/tasks'
import { Input } from '@/components/ui/input'

export function TasksList({ onEditTask }: { onEditTask: (task: Task) => void }) {
  const { 
    filteredTasks, loading, projects,
    handleToggleTaskStatus, handleStatusChange,
    changeStatusMutation, toggleStatusMutation,
    selectedTask, setSelectedTask, setTaskDetailsOpen,
    selectedTab, setSelectedTab, searchQuery, setSearchQuery,
    selectedProjectId, setSelectedProjectId
  } = useTasks()

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
              className={`group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:bg-card hover:border-border/40 hover:shadow-sm cursor-pointer ${
                selectedTask?.id === task.id ? 'bg-card border-border/60 shadow-sm' : ''
              }`}
            >
              <div className="flex items-center self-start pt-0.5">
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
              
              <div className="flex flex-1 flex-col min-w-0">
                <p className={`text-sm font-medium truncate ${task.status === 5 ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {task.title}
                </p>
                <div className="mt-1 flex items-center flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
                  {task.projectName && (
                    <span className="flex items-center gap-1 opacity-80">
                      <FolderDot className="size-3" /> {task.projectName}
                    </span>
                  )}
                  {task.projectName && <span className="opacity-40">•</span>}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      onClick={(e) => e.stopPropagation()}
                      disabled={changeStatusMutation.isPending}
                      className={`flex items-center gap-1 transition-colors hover:text-foreground outline-none ${
                        task.status === 8 ? 'text-destructive/90' :
                        task.status === 2 || task.status === 6 ? 'text-chart-2/90' :
                        task.status === 7 ? 'text-orange-500/90' : ''
                      } disabled:opacity-50`}
                    >
                      <Circle className="size-2.5 fill-current" />
                      {TASK_STATUS_MAP[task.status] || 'Unknown'}
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
                      <span className="opacity-40">•</span>
                      <span className={`flex items-center gap-1 ${task.dueDate < todayStr && task.status !== 5 ? 'text-destructive font-semibold' : ''}`}>
                        <Calendar className="size-3" /> 
                        {task.dueDate === todayStr ? 'Today' : task.dueDate.split('T')[0]}
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
                  <div className="flex -space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {task.assignees.map((a: any) => (
                      <Avatar key={a.id} className="size-5 border border-background">
                        <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">{a.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
                
                <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={e => e.stopPropagation()} className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                        Edit Task
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
      <div className="flex items-center gap-1 border-b border-border/40 pb-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedTab === tab.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Utility Row (Search, Filter, Sort) */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 h-9 bg-muted/30 border-border/60 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs border-border/60 shadow-sm bg-card">
            <ListFilter className="size-3.5 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs border-border/60 shadow-sm bg-card">
            <ArrowDownAZ className="size-3.5 mr-2" /> Sort
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 pb-10">
        {filteredTasks.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-3 border border-border/50">
              <CheckCircle2 className="size-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">No tasks found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">You're all caught up! Create a new task to get started.</p>
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
