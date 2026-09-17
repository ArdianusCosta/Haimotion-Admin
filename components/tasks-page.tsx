'use client'

import { useState, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Calendar, 
  ChevronDown, 
  Clock, 
  Filter, 
  Inbox, 
  LayoutList, 
  MoreVertical, 
  Plus, 
  Search, 
  Star, 
  Tag, 
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  FolderDot,
  Video
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getTasksData, createTask, updateTask, deleteTask, getTaskComments, createTaskComment, getTaskForEdit } from '@/app/actions/tasks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScheduleMeetingDialog } from '@/components/schedule-meeting-dialog'

export const TASK_STATUS_MAP: Record<number, string> = {
  1: 'To Do',
  0: 'Pending',
  6: 'Started',
  2: 'In Progress',
  3: 'In Review',
  4: 'Revisions',
  7: 'Hold',
  8: 'Overdue',
  5: 'Done'
}

export function TasksPage() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // TanStack Query for Data Fetching
  const { data, isLoading: loading } = useQuery({
    queryKey: ['tasksData'],
    queryFn: async () => {
      const res = await getTasksData()
      if (!res.success) throw new Error(res.error)
      return res
    }
  })

  const tasks = data?.tasks || []
  const projects = data?.projects || []
  const users = data?.users || []
  const currentUserId = data?.currentUserId || 0

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtering & Selection
  const [selectedCategory, setSelectedCategory] = useState<'inbox'|'today'|'upcoming'|'filters'>('inbox')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const pid = searchParams.get('projectId')
    return pid ? parseInt(pid) : null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Dialogs
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null)
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    description: '',
    status: 1,
    projectId: 0,
    assignees: [] as number[],
    dueDate: ''
  })
  
  // Assignee Dropdown
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
  const [isEditingTask, setIsEditingTask] = useState(false)

  // Comments State
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState<number | null>(null)
  
  // Mentions State
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Fetch Comments for selected task
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['taskComments', formData.id],
    queryFn: async () => {
      if (!formData.id) return { comments: [] }
      const res = await getTaskComments(formData.id)
      if (!res.success) throw new Error(res.error)
      return res
    },
    enabled: !!formData.id && taskDialogOpen,
    refetchInterval: 3000,
  })

  useEffect(() => {
    if (commentsData?.comments && taskDialogOpen) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [commentsData?.comments, taskDialogOpen])
  
  const postCommentMut = useMutation({
    mutationFn: async () => {
      if (!formData.id || !newComment.trim()) return
      const res = await createTaskComment(formData.id, newComment, replyToId || undefined)
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      setNewComment('')
      setReplyToId(null)
      refetchComments()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post comment')
    }
  })

  // Derived state for counters and filtering
  const todayStr = new Date().toISOString().split('T')[0]
  
  const inboxCount = tasks.length
  const todayCount = tasks.filter((t: any) => t.dueDate && t.dueDate.startsWith(todayStr)).length
  const upcomingCount = tasks.filter((t: any) => t.dueDate && t.dueDate > todayStr).length

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (selectedCategory === 'today') {
      result = result.filter((t: any) => t.dueDate && t.dueDate.startsWith(todayStr))
    } else if (selectedCategory === 'upcoming') {
      result = result.filter((t: any) => t.dueDate && t.dueDate > todayStr)
    }

    if (selectedProjectId) {
      result = result.filter((t: any) => t.projectId === selectedProjectId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t: any) => 
        t.title.toLowerCase().includes(q) || 
        (t.rawDescription && t.rawDescription.toLowerCase().includes(q))
      )
    }

    return result
  }, [tasks, selectedCategory, selectedProjectId, searchQuery, todayStr])

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: async (task: any) => {
      const newStatus = task.status === 5 ? 1 : 5
      return updateTask(task.dbId, {
        title: task.title,
        description: task.rawDescription,
        status: newStatus,
        assignees: task.assignees.map((a:any)=>a.id),
        projectId: task.projectId,
        dueDate: task.dueDate
      })
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['tasksData'] })
      const previousData = queryClient.getQueryData(['tasksData'])
      const newStatus = task.status === 5 ? 1 : 5
      queryClient.setQueryData(['tasksData'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t)
        }
      })
      return { previousData }
    },
    onSuccess: () => {
      toast.success('Task status updated')
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasksData'], context?.previousData)
      toast.error('Failed to update status')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasksData'] })
    }
  })

  const changeStatusMutation = useMutation({
    mutationFn: async ({ task, newStatus }: { task: any, newStatus: number }) => {
      return updateTask(task.dbId, {
        title: task.title,
        description: task.rawDescription,
        status: newStatus,
        assignees: task.assignees.map((a:any)=>a.id),
        projectId: task.projectId,
        dueDate: task.dueDate
      })
    },
    onMutate: async ({ task, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasksData'] })
      const previousData = queryClient.getQueryData(['tasksData'])
      queryClient.setQueryData(['tasksData'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t)
        }
      })
      return { previousData }
    },
    onSuccess: () => {
      toast.success('Task status updated')
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasksData'], context?.previousData)
      toast.error('Failed to update status')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasksData'] })
    }
  })

  const saveTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      return formData.id 
        ? await updateTask(formData.id, payload)
        : await createTask(payload)
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(formData.id ? 'Task updated' : 'Task created')
        setTaskDialogOpen(false)
        // Use refetchQueries to ensure fresh data (including assignees) is loaded before next edit
        queryClient.refetchQueries({ queryKey: ['tasksData'] })
      } else {
        toast.error(res.error || 'Failed to save task')
      }
    },
    onError: () => toast.error('An error occurred while saving')
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return await deleteTask(id)
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Task deleted')
        setTaskDetailsOpen(false)
        queryClient.invalidateQueries({ queryKey: ['tasksData'] })
      } else {
        toast.error(res.error || 'Failed to delete task')
      }
    },
    onError: () => toast.error('An error occurred while deleting')
  })

  // Handlers
  const handleToggleTaskStatus = (task: any) => toggleStatusMutation.mutate(task)
  const handleStatusChange = (task: any, newStatus: number) => changeStatusMutation.mutate({ task, newStatus })

  const openNewTaskDialog = () => {
    setFormData({
      id: 0,
      title: '',
      description: '',
      status: 1,
      projectId: selectedProjectId || (projects[0]?.id || 0),
      assignees: [],
      dueDate: ''
    })
    setTaskDialogOpen(true)
  }

  const openEditTaskDialog = async (task: any) => {
    // Fetch fresh task data from server to get correct assignees (bypass stale cache)
    const res = await getTaskForEdit(task.dbId)
    if (res.success && res.task) {
      setFormData({
        id: res.task.id,
        title: res.task.title,
        description: res.task.description,
        status: res.task.status,
        projectId: res.task.projectId,
        assignees: res.task.assignees,
        dueDate: res.task.dueDate
      })
    } else {
      // Fallback: use cached data
      const assigneeIds = (task.assignees || []).map((a: any) => Number(a.id))
      setFormData({
        id: task.dbId,
        title: task.title,
        description: task.rawDescription || task.description || '',
        status: task.status,
        projectId: task.projectId,
        assignees: assigneeIds,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      })
    }
    setTaskDialogOpen(true)
  }

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.projectId) {
      toast.error("Please select a project")
      return
    }
    
    saveTaskMutation.mutate({
      title: formData.title,
      description: formData.description,
      status: formData.status,
      assignees: formData.assignees,
      projectId: formData.projectId,
      dueDate: formData.dueDate
    })
  }

  const confirmDeleteTask = (id: number) => {
    setTaskToDelete(id)
    setDeleteDialogOpen(true)
  }

  const executeDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete)
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }

  const openProjectDetails = (project: any) => {
    setSelectedProject(project)
    setProjectDialogOpen(true)
  }

  const openTaskDetails = (task: any) => {
    setSelectedTask(task)
    setTaskDetailsOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-card">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-border bg-muted/10 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <button 
            onClick={openNewTaskDialog}
            className="flex w-full items-center gap-2 justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> Add Task
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => { setSelectedCategory('inbox'); setSelectedProjectId(null); }}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              selectedCategory === 'inbox' && !selectedProjectId ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3"><Inbox className="size-4" /> Inbox</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === 'inbox' && !selectedProjectId ? 'bg-primary/20' : 'bg-muted'}`}>{inboxCount}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('today'); setSelectedProjectId(null); }}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              selectedCategory === 'today' && !selectedProjectId ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3"><Star className="size-4" /> Today</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === 'today' && !selectedProjectId ? 'bg-primary/20' : 'bg-muted'}`}>{todayCount}</span>
          </button>

          <button
            onClick={() => { setSelectedCategory('upcoming'); setSelectedProjectId(null); }}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              selectedCategory === 'upcoming' && !selectedProjectId ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3"><Calendar className="size-4" /> Upcoming</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === 'upcoming' && !selectedProjectId ? 'bg-primary/20' : 'bg-muted'}`}>{upcomingCount}</span>
          </button>

          <div className="pt-6 pb-2 px-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</p>
          </div>
          
          {loading ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="size-3 animate-spin" /> Loading...
            </div>
          ) : (
            projects.map((project: any) => (
              <div key={project.id} className="group relative">
                <button 
                  onClick={() => { setSelectedProjectId(project.id); setSelectedCategory('inbox'); }}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    selectedProjectId === project.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <FolderDot className={`size-4 ${selectedProjectId === project.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate flex-1 text-left">{project.name}</span>
                </button>
                <button 
                  onClick={() => openProjectDetails(project)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 hover:text-primary text-muted-foreground"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        <div className="flex items-center justify-between border-b border-border p-4 md:px-6 h-16 shrink-0">
          <div className="flex items-center gap-2">
            {selectedProjectId ? (
              <FolderDot className="size-5 text-primary" />
            ) : selectedCategory === 'today' ? (
              <Star className="size-5 text-primary" />
            ) : selectedCategory === 'upcoming' ? (
              <Calendar className="size-5 text-primary" />
            ) : (
              <Inbox className="size-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold tracking-tight">
              {selectedProjectId 
                ? projects.find((p: any) => p.id === selectedProjectId)?.name 
                : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`transition-all duration-300 ease-in-out overflow-hidden flex items-center ${isSearchActive ? 'w-48 sm:w-64 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..." 
                  className="w-full rounded-md border border-border bg-muted/30 py-1.5 pl-8 pr-8 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="size-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => {
                setIsSearchActive(!isSearchActive); 
                if (!isSearchActive) setTimeout(() => searchInputRef.current?.focus(), 100);
              }} 
              className={`rounded-md p-2 hover:bg-muted ${isSearchActive ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="space-y-1">
                {filteredTasks.filter((t: any) => t.status !== 5).length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
                    <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <CheckCircle2 className="size-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">No active tasks found</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery ? 'Try a different search term.' : 'You are all caught up!'}
                    </p>
                  </div>
                ) : (
                  filteredTasks.filter((t: any) => t.status !== 5).map((task: any) => (
                    <div key={task.id} className="group flex items-start gap-3 rounded-lg border border-transparent p-3 hover:border-border hover:bg-card hover:shadow-sm transition-all cursor-pointer" onClick={() => openTaskDetails(task)}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task); }}
                        disabled={toggleStatusMutation.isPending}
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-transparent hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{task.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          {!selectedProjectId && (
                            <span className="flex items-center gap-1">
                              <FolderDot className="size-3" /> <span className="truncate max-w-[120px]">{task.projectName}</span>
                            </span>
                          )}
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${task.dueDate.startsWith(todayStr) ? 'text-primary font-medium' : task.dueDate < todayStr ? 'text-destructive font-medium' : ''}`}>
                              <Calendar className="size-3" /> {task.dueDate.split('T')[0]}
                            </span>
                          )}
                          <select 
                            value={task.status}
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(task, parseInt(e.target.value))}
                            disabled={changeStatusMutation.isPending}
                            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 border border-transparent outline-none cursor-pointer appearance-none bg-muted/50 hover:bg-muted font-medium ${
                              task.status === 8 ? 'text-destructive' :
                              task.status === 2 || task.status === 6 ? 'text-chart-2' :
                              task.status === 7 ? 'text-orange-500' : ''
                            } disabled:opacity-50`}
                          >
                            {Object.entries(TASK_STATUS_MAP).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex shrink-0 items-center gap-3" onClick={e => e.stopPropagation()}>
                        {task.assignees.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {task.assignees.slice(0,3).map((a:any, i:number) => (
                              <div 
                                key={i}
                                className="flex size-6 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground ring-2 ring-background"
                                title={a.name}
                              >
                                {a.initials}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                               <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-background">
                                 +{task.assignees.length - 3}
                               </div>
                            )}
                          </div>
                        )}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditTaskDialog(task)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit task"><LayoutList className="size-3.5" /></button>
                          <button onClick={() => confirmDeleteTask(task.dbId)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" title="Delete task"><Trash2 className="size-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredTasks.some((t: any) => t.status === 5) && (
                <div className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3 px-2">
                    <CheckCircle2 className="size-4" />
                    Completed ({filteredTasks.filter((t: any) => t.status === 5).length})
                  </div>
                  <div className="space-y-1 opacity-70">
                    {filteredTasks.filter((t: any) => t.status === 5).map((task: any) => (
                      <div key={task.id} className="group flex items-start gap-3 rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openTaskDetails(task)}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task); }}
                          disabled={toggleStatusMutation.isPending}
                          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3.5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground line-through line-clamp-1">{task.title}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditTaskDialog(task)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit"><LayoutList className="size-3" /></button>
                          <button onClick={() => confirmDeleteTask(task.dbId)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" title="Delete"><Trash2 className="size-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className={formData.id > 0 ? "sm:max-w-4xl w-[95vw]" : "sm:max-w-[500px]"}>
          <div className={formData.id > 0 ? "flex flex-col md:flex-row gap-6 h-full" : ""}>
            
            {/* Left Column (Task Form) */}
            <form onSubmit={handleSaveTask} className={`flex flex-col h-full ${formData.id > 0 ? 'flex-1 w-full max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
              <DialogHeader>
                <DialogTitle>{formData.id ? 'Task Details' : 'Create Task'}</DialogTitle>
                {formData.id > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Manage task details, assignees, and status.
                  </div>
                )}
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="E.g., Update landing page copy" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project">Project</Label>
                    <select 
                      id="project" 
                      value={formData.projectId} 
                      onChange={e => setFormData({...formData, projectId: parseInt(e.target.value)})}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                      required
                    >
                      <option value={0} disabled>Select project...</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select 
                      id="status" 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                    >
                      {Object.entries(TASK_STATUS_MAP).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input disabled value={todayStr} type="date" className="opacity-50 cursor-not-allowed" title="Auto-generated" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input 
                      id="dueDate" 
                      type="date"
                      value={formData.dueDate} 
                      onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary custom-scrollbar"
                    placeholder="Provide a detailed description of the task..."
                  />
                </div>

                <div className="grid gap-2 relative assignee-dropdown-container">
                  <Label>Assignees</Label>
                  <div 
                    className="flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    {formData.assignees.length === 0 && <span className="text-muted-foreground mt-0.5">Select members...</span>}
                    {formData.assignees.map(id => {
                      const u = users.find((u: any) => Number(u.id) === Number(id))
                      if (!u) return null
                      return (
                        <span key={id} className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                          {u.name}
                          <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            setFormData({...formData, assignees: formData.assignees.filter(a => Number(a) !== Number(id))})
                          }} className="hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10"><X className="size-3" /></button>
                        </span>
                      )
                    })}
                  </div>
                  
                  {showAssigneeDropdown && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md flex flex-col">
                      <div className="p-2 border-b border-border/50 sticky top-0 bg-popover z-10">
                        <input 
                          autoFocus
                          placeholder="Search team members..." 
                          value={assigneeSearchQuery}
                          onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                          className="w-full rounded-sm bg-muted/50 py-1.5 px-3 text-xs outline-none"
                        />
                      </div>
                      <div className="overflow-y-auto p-1 max-h-36 custom-scrollbar">
                        {users.filter((u: any) => u.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())).map((u: any) => {
                          const isSelected = formData.assignees.some(id => Number(id) === Number(u.id))
                          return (
                            <div 
                              key={u.id}
                              className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted ${isSelected ? 'bg-muted/50' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({...formData, assignees: formData.assignees.filter(id => Number(id) !== Number(u.id))})
                                } else {
                                  setFormData({...formData, assignees: [...formData.assignees, Number(u.id)]})
                                }
                                setShowAssigneeDropdown(false)
                                setAssigneeSearchQuery('')
                              }}
                            >
                              <div className={`flex size-4 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}>
                                 {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-4 pb-2">
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>Close</Button>
                  <Button type="submit" disabled={saveTaskMutation.isPending}>
                    {saveTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Task
                  </Button>
                </div>
              </div>
            </form>

            {/* Right Column (Comments UI) */}
            {formData.id > 0 && (
              <div className="w-full md:w-[350px] shrink-0 flex flex-col h-full max-h-[75vh] border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <Label className="text-base font-semibold">Comments</Label>
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                    {commentsData?.comments?.length || 0}
                  </span>
                </div>

                {/* Comments List */}
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
                  {commentsData?.comments && commentsData.comments.length > 0 ? (
                    (() => {
                      const rootComments = commentsData.comments.filter((c: any) => !c.parent_id);
                      return rootComments.map((comment: any) => {
                        const commentUser = users.find((u: any) => Number(u.id) === Number(comment.user_id));
                        const avatarFallback = commentUser?.name ? commentUser.name[0].toUpperCase() : 'U';
                        const replies = commentsData.comments.filter((c: any) => c.parent_id === comment.id);
                        
                        const isMine = Number(comment.user_id) === currentUserId;

                        return (
                          <div key={comment.id} className="space-y-2">
                            {/* Root Comment Bubble */}
                            <div className={`flex gap-3 text-sm group ${isMine ? 'flex-row-reverse' : ''}`}>
                              <Avatar className="size-8 shrink-0 mt-1">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{avatarFallback}</AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                  <span className="font-semibold text-xs">{commentUser?.name || 'Unknown User'}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <div className={`px-3 py-2 rounded-2xl whitespace-pre-wrap leading-relaxed ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                                  {comment.comment.split(/(@\w+(?:\s\w+)?)/g).map((part: string, i: number) => 
                                    part.startsWith('@') ? <span key={i} className={`font-bold px-1 rounded-sm ${isMine ? 'bg-primary-foreground/20' : 'bg-primary/20 text-primary'}`}>{part}</span> : part
                                  )}
                                </div>
                                <button 
                                  onClick={() => setReplyToId(comment.id)} 
                                  className={`text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 mt-1 ${isMine ? 'mr-1' : 'ml-1'}`}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                            
                            {/* Replies */}
                            {replies.length > 0 && (
                              <div className="space-y-3 mt-2 pl-11">
                                {replies.map((reply: any) => {
                                  const replyUser = users.find((u: any) => Number(u.id) === Number(reply.user_id));
                                  const rFallback = replyUser?.name ? replyUser.name[0].toUpperCase() : 'U';
                                  const isReplyMine = Number(reply.user_id) === currentUserId;
                                  
                                  return (
                                    <div key={reply.id} className={`flex gap-2.5 text-sm group ${isReplyMine ? 'flex-row-reverse pr-2' : ''}`}>
                                      <Avatar className="size-6 shrink-0 mt-1">
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{rFallback}</AvatarFallback>
                                      </Avatar>
                                      <div className={`flex flex-col ${isReplyMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                        <div className={`flex items-center gap-2 mb-0.5 ${isReplyMine ? 'flex-row-reverse' : ''}`}>
                                          <span className="font-semibold text-xs">{replyUser?.name || 'Unknown User'}</span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {new Date(reply.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        </div>
                                        <div className={`px-2.5 py-1.5 text-xs rounded-2xl whitespace-pre-wrap leading-relaxed ${isReplyMine ? 'bg-primary/90 text-primary-foreground rounded-tr-sm' : 'bg-muted/80 text-foreground rounded-tl-sm'}`}>
                                          {reply.comment.split(/(@\w+(?:\s\w+)?)/g).map((part: string, i: number) => 
                                            part.startsWith('@') ? <span key={i} className={`font-bold px-1 rounded-sm ${isReplyMine ? 'bg-primary-foreground/20' : 'bg-primary/20 text-primary'}`}>{part}</span> : part
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Inbox className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No comments yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Be the first to share an update.</p>
                    </div>
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Comment Input Area */}
                <div className="pt-4 shrink-0 mt-auto relative">
                  {replyToId && (
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded-t-lg text-xs border border-b-0 border-border">
                      <span className="text-muted-foreground">
                        Replying to comment...
                      </span>
                      <button onClick={() => setReplyToId(null)} className="hover:text-destructive"><X className="size-3" /></button>
                    </div>
                  )}
                  
                  {/* Mentions Popover */}
                  {mentionOpen && (
                    <div className="absolute bottom-full left-0 mb-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg custom-scrollbar z-50">
                      {users.filter((u: any) => u.name.toLowerCase().includes(mentionSearch.toLowerCase())).map((u: any) => (
                        <div 
                          key={u.id}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            const beforeMention = newComment.substring(0, newComment.lastIndexOf('@'));
                            setNewComment(beforeMention + '@' + u.name + ' ');
                            setMentionOpen(false);
                            setMentionSearch('');
                          }}
                        >
                          <Avatar className="size-5 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-[9px]">{u.name[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{u.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col rounded-lg border border-border bg-card focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-shadow">
                    <textarea 
                      placeholder="Add a comment... (Type @ to tag)"
                      value={newComment}
                      onChange={e => {
                        const val = e.target.value;
                        setNewComment(val);
                        // Mention Detection Logic
                        const match = val.match(/@(\w*)$/);
                        if (match) {
                          setMentionOpen(true);
                          setMentionSearch(match[1]);
                        } else {
                          setMentionOpen(false);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (newComment.trim()) postCommentMut.mutate()
                        }
                      }}
                      className="min-h-[80px] w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground custom-scrollbar"
                    />
                    <div className="flex items-center justify-between px-2 py-2 bg-muted/30 border-t border-border">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <button type="button" onClick={() => { setMentionOpen(true); setNewComment(newComment + '@'); }} className="p-1.5 rounded hover:bg-muted hover:text-foreground transition-colors" title="Mention user">
                          <Tag className="size-4" />
                        </button>
                      </div>
                      <Button 
                        type="button" 
                        size="sm"
                        className="h-7 text-xs font-semibold px-4"
                        onClick={() => postCommentMut.mutate()}
                        disabled={!newComment.trim() || postCommentMut.isPending}
                      >
                        {postCommentMut.isPending ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
                        Post
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            )}
            
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        {/* Fix: Width updated to max-w-2xl for more spacious layout */}
        <DialogContent className="sm:max-w-2xl">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedProject.name}</DialogTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Created on {selectedProject.startDate ? selectedProject.startDate.split('T')[0] : 'Unknown'}
                  {selectedProject.endDate && ` • Due ${selectedProject.endDate.split('T')[0]}`}
                </div>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {selectedProject.description || 'No description provided.'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Progress</h4>
                    <span className="text-sm font-bold text-primary">{selectedProject.progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-muted overflow-hidden rounded-full flex">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out" 
                      style={{ width: `${selectedProject.progress}%` }} 
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{selectedProject.completedTasks} completed</span>
                    <span>{selectedProject.totalTasks} total tasks</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-3 text-center bg-card">
                    <div className="text-2xl font-bold text-foreground">{selectedProject.inProgressTasks}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">In Progress</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center bg-card">
                    <div className="text-2xl font-bold text-foreground">{selectedProject.pendingTasks}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Pending</div>
                  </div>
                </div>

                {selectedProject.members.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Project Members</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.members.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1 border border-border">
                           <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                             {m.initials}
                           </div>
                           <span className="text-xs font-medium">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={taskDetailsOpen} onOpenChange={setTaskDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${selectedTask.tagColor}`}>{selectedTask.tag}</span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-foreground">
                    {TASK_STATUS_MAP[selectedTask.status] || 'Unknown'}
                  </span>
                </div>
                <DialogTitle className="text-xl leading-tight">{selectedTask.title}</DialogTitle>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1"><FolderDot className="size-3" /> {selectedTask.projectName}</span>
                  {selectedTask.dueDate && <span className="flex items-center gap-1"><Calendar className="size-3" /> Due {selectedTask.dueDate.split('T')[0]}</span>}
                </div>
                
                <div className="mt-4 border-b border-border pb-4 flex gap-2">
                   <Button size="sm" variant="outline" onClick={() => setIsScheduleMeetingOpen(true)}>
                     <Video className="size-4 mr-2" /> Schedule Meeting
                   </Button>
                </div>
              </DialogHeader>
              
              <div className="py-4 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>
                
                {selectedTask.assignees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Assignees</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.assignees.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 bg-background rounded-full pl-1 pr-3 py-1 border border-border shadow-sm">
                           <div className="size-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-accent-foreground">
                             {m.initials}
                           </div>
                           <span className="text-xs font-medium">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex items-center justify-between border-t border-border pt-4 sm:justify-between">
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => confirmDeleteTask(selectedTask.dbId)}
                  disabled={deleteTaskMutation.isPending}
                >
                  <Trash2 className="size-4 mr-2" /> Delete Task
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setTaskDetailsOpen(false)}>Close</Button>
                  <Button type="button" onClick={() => { setTaskDetailsOpen(false); openEditTaskDialog(selectedTask); }}>
                    Edit Task
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this task? This action cannot be undone.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deleteTaskMutation.isPending}>
              {deleteTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScheduleMeetingDialog 
        open={isScheduleMeetingOpen} 
        onOpenChange={setIsScheduleMeetingOpen} 
        defaultValues={{ taskId: selectedTask?.dbId, projectId: selectedTask?.projectId }}
      />
    </div>
  )
}

export default TasksPage
