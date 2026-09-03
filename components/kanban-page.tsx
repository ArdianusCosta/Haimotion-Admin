'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, MessageSquare, Paperclip, CalendarDays, Filter, Loader2, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getKanbanTasks, updateTaskStatus, getTaskDetails, addComment, uploadAttachment } from '@/app/actions/kanban'

export function KanbanPage() {
  const queryClient = useQueryClient()

  // Queries
  const { data, isLoading: loading } = useQuery({
    queryKey: ['kanbanTasks'],
    queryFn: async () => {
      const res = await getKanbanTasks()
      if (!res.success) throw new Error(res.error)
      return res
    }
  })

  const columns = data?.data || []
  const users = data?.users || []
  
  // Dialog states
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Selected Data
  const [selectedTask, setSelectedTask] = useState<any>(null)
  
  const { data: taskDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['taskDetails', selectedTask?.dbId],
    queryFn: async () => {
      if (!selectedTask) return null
      const res = await getTaskDetails(selectedTask.dbId)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    enabled: !!selectedTask && isDetailsDialogOpen
  })

  const taskDetails = taskDetailsData || { comments: [], attachments: [] }
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  
  // Comment state
  const [newComment, setNewComment] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  
  // Global filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssignees, setFilterAssignees] = useState<number[]>([])
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false)
      }
      setOpenDropdownId(null)
      setShowMentions(false)
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Mutations
  const moveTaskMutation = useMutation({
    mutationFn: async ({ dbId, newStatus }: { dbId: number, newStatus: number, movedTaskId: string }) => {
      const res = await updateTaskStatus(dbId, newStatus)
      if (!res.success) throw new Error(res?.error || 'Failed to update')
      return res
    },
    onMutate: async ({ newStatus, movedTaskId }) => {
      await queryClient.cancelQueries({ queryKey: ['kanbanTasks'] })
      const previousData = queryClient.getQueryData(['kanbanTasks'])
      
      queryClient.setQueryData(['kanbanTasks'], (old: any) => {
        if (!old) return old
        
        const newCols = old.data.map((c: any) => ({ ...c, tasks: [...c.tasks] }))
        let taskToMove: any = null
        
        for (const col of newCols) {
          const idx = col.tasks.findIndex((t: any) => t.id === movedTaskId)
          if (idx > -1) {
            taskToMove = { ...col.tasks[idx], status: newStatus }
            col.tasks.splice(idx, 1)
            break
          }
        }
        
        if (taskToMove) {
          const targetCol = newCols.find((c: any) => parseInt(c.id) === newStatus)
          if (targetCol) {
            targetCol.tasks.push(taskToMove)
          }
        }
        
        return { ...old, data: newCols }
      })
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['kanbanTasks'], context?.previousData)
      toast.error('Failed to move task')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanTasks'] })
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: async (payload: { taskId: number, userId: number, text: string }) => {
      return await addComment(payload.taskId, payload.userId, payload.text)
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['taskDetails', selectedTask?.dbId] })
      queryClient.invalidateQueries({ queryKey: ['kanbanTasks'] })
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add comment')
  })

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (payload: { taskId: number, url: string, name: string }) => {
      return await uploadAttachment(payload.taskId, payload.url, payload.name)
    },
    onSuccess: () => {
      toast.success('File uploaded')
      queryClient.invalidateQueries({ queryKey: ['taskDetails', selectedTask?.dbId] })
      queryClient.invalidateQueries({ queryKey: ['kanbanTasks'] })
    },
    onError: (err: any) => toast.error(err.message || 'Upload failed')
  })

  // --- Drag and Drop ---
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColId: string, taskDbId: number) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.setData('sourceColId', sourceColId)
    e.dataTransfer.setData('taskDbId', taskDbId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const sourceColId = e.dataTransfer.getData('sourceColId')
    const taskDbId = parseInt(e.dataTransfer.getData('taskDbId'))
    
    if (!taskId || !taskDbId || sourceColId === targetStatusId) return

    const newStatus = parseInt(targetStatusId)
    moveTaskMutation.mutate({ dbId: taskDbId, newStatus, movedTaskId: taskId })
  }

  // --- Task Operations ---
  const openTaskDetails = (task: any) => {
    setSelectedTask(task)
    setIsDetailsDialogOpen(true)
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !selectedTask) return
    const userId = 1 // Demo user ID
    addCommentMutation.mutate({ taskId: selectedTask.dbId, userId, text: newComment })
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewComment(val)
    
    const cursor = e.target.selectionStart || 0
    const textBeforeCursor = val.substring(0, cursor)
    
    const match = textBeforeCursor.match(/(?:^|\s)@(\w*)$/)
    if (match) {
      setShowMentions(true)
      setMentionQuery(match[1])
      setMentionPosition(cursor - match[1].length)
    } else {
      setShowMentions(false)
    }
  }

  const handleSelectMention = (user: any) => {
    const textBefore = newComment.substring(0, mentionPosition - 1)
    const textAfter = newComment.substring(inputRef.current?.selectionStart || 0)
    const mentionText = `@${user.firstname}${user.lastname ? '_' + user.lastname : ''} `
    
    setNewComment(textBefore + mentionText + textAfter)
    setShowMentions(false)
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 10)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedTask) return
    
    const fakeUrl = URL.createObjectURL(file)
    uploadAttachmentMutation.mutate({ taskId: selectedTask.dbId, url: fakeUrl, name: file.name })
  }

  // COMPUTE FILTERED COLUMNS
  const filteredColumns = columns.map((col: any) => ({
    ...col,
    tasks: col.tasks.filter((task: any) => {
      const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchFilter = filterAssignees.length === 0 || 
                          filterAssignees.some(id => task.assignees.some((a: any) => a.id === id))
      return matchSearch && matchFilter
    })
  }))

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Apps</span><span>/</span><span className="text-foreground">Kanban</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Project Board</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage tasks, track progress, and collaborate with your team.</p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:w-64 focus-within:ring-1 focus-within:ring-ring">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none" 
            />
          </div>
          <div className="flex gap-2">
            <div className="relative filter-dropdown-container">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted ${filterAssignees.length > 0 ? 'border-primary text-primary bg-primary/5' : ''}`}
              >
                <Filter className="size-4" /> 
                Filter {filterAssignees.length > 0 && `(${filterAssignees.length})`}
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-2 shadow-md animate-in fade-in zoom-in-95">
                  <h4 className="mb-2 text-xs font-semibold text-muted-foreground px-1">Filter by Assignee</h4>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {users.map((u: any) => {
                      const isSelected = filterAssignees.includes(u.id)
                      return (
                        <div 
                          key={u.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted ${isSelected ? 'bg-muted/50' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setFilterAssignees(filterAssignees.filter(id => id !== u.id))
                            } else {
                              setFilterAssignees([...filterAssignees, u.id])
                            }
                          }}
                        >
                          <div className={`flex size-4 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}>
                             {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span>{u.firstname} {u.lastname}</span>
                        </div>
                      )
                    })}
                  </div>
                  {filterAssignees.length > 0 && (
                    <button 
                      onClick={() => setFilterAssignees([])}
                      className="mt-2 w-full rounded-sm bg-muted px-2 py-1.5 text-xs font-medium hover:bg-destructive/10 hover:text-destructive"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {loading ? (
          // Skeleton Loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-[320px] shrink-0 flex-col rounded-xl bg-muted/30 p-3 border border-border/50 animate-pulse">
              <div className="mb-4 flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-muted" />
                <div className="h-5 w-24 rounded bg-muted" />
              </div>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="rounded-xl border border-border bg-card p-4 h-32" />
                ))}
              </div>
            </div>
          ))
        ) : (
          filteredColumns.map((column: any) => (
            <div 
              key={column.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex w-[320px] shrink-0 flex-col rounded-xl bg-muted/30 p-3 transition-colors border border-border/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${column.color}`} />
                  <h2 className="font-semibold">{column.title}</h2>
                  <span className="flex size-5 items-center justify-center rounded-full bg-background border border-border text-[10px] font-medium text-muted-foreground">
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              
              {/* Task List */}
              <div className="flex flex-col gap-3 flex-1 min-h-[200px]">
                {column.tasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, column.id, task.dbId)}
                    onClick={() => openTaskDetails(task)}
                    className="group cursor-grab active:cursor-grabbing relative rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${task.tagColor}`}>{task.tag}</span>
                    </div>
                    
                    <h3 className="font-medium text-foreground">{task.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
                    
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <div className="flex gap-3 text-muted-foreground">
                        {task.comments > 0 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <MessageSquare className="size-3.5" /> <span>{task.comments}</span>
                          </div>
                        )}
                        {task.attachments > 0 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Paperclip className="size-3.5" /> <span>{task.attachments}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <CalendarDays className="size-3" /> {task.date}
                        </div>
                        {task.assignees.length > 0 && (
                          <div className="flex -space-x-2">
                            {task.assignees.map((a: any, i: number) => (
                              <div key={i} title={a.name} className={`flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[9px] font-bold text-primary-foreground`}>
                                {a.initials}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Details / Comments Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-8">
                  <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${selectedTask.tagColor}`}>{selectedTask.tag}</span>
                  <span className="text-xs text-muted-foreground">Created {selectedTask.date}</span>
                </div>
                <DialogTitle className="text-xl mt-2">{selectedTask.title}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                <div className="md:col-span-2 flex flex-col gap-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedTask.description || 'No description provided.'}</p>
                  </div>
                  
                  {/* Attachments */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        Attachments {detailsLoading && <Loader2 className="size-3 animate-spin" />} 
                        {!detailsLoading && `(${taskDetails.attachments.length})`}
                      </h3>
                      <div>
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploadAttachmentMutation.isPending} />
                        <label htmlFor="file-upload" className={`cursor-pointer text-xs flex items-center gap-1 text-primary hover:underline ${uploadAttachmentMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadAttachmentMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />} Add file
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {taskDetails.attachments.map((att: any) => (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 hover:bg-muted/50 text-sm transition-colors">
                          <Paperclip className="size-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{att.file_name}</span>
                        </a>
                      ))}
                      {!detailsLoading && taskDetails.attachments.length === 0 && (
                        <p className="text-xs text-muted-foreground">No attachments.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Comments */}
                  <div className="flex flex-col h-[280px]">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      Comments {detailsLoading && <Loader2 className="size-3 animate-spin" />}
                      {!detailsLoading && `(${taskDetails.comments.length})`}
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-3">
                      {taskDetails.comments.map((comment: any) => {
                        const isMe = comment.user_id === 1;
                        return (
                          <div key={comment.id} className={`flex gap-3 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <div className="size-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold shrink-0 text-primary-foreground shadow-sm">
                                {comment.user?.initials || `U${comment.user_id}`}
                              </div>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                              <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-xs font-semibold">{comment.user?.name || `User ${comment.user_id}`}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                              </div>
                              <div className={`text-sm mt-0.5 whitespace-pre-wrap rounded-2xl px-4 py-2 shadow-sm border ${
                                isMe 
                                ? 'bg-primary text-primary-foreground border-primary rounded-tr-none' 
                                : 'bg-muted/50 text-foreground border-border rounded-tl-none'
                              }`}>
                                {comment.comment.split(/(@\w+(?: \w+)?)/g).map((part: string, i: number) => 
                                  part.startsWith('@') ? <span key={i} className={isMe ? 'font-bold opacity-90' : 'text-primary font-bold'}>{part}</span> : part
                                )}
                              </div>
                            </div>
                            {isMe && (
                              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0 text-primary border border-primary/30 shadow-sm">
                                {comment.user?.initials || `U${comment.user_id}`}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {!detailsLoading && taskDetails.comments.length === 0 && (
                        <p className="text-xs text-muted-foreground">No comments yet. Type @ to mention someone.</p>
                      )}
                    </div>
                    
                    {/* Add Comment */}
                    <form onSubmit={handleAddComment} className="mt-auto relative">
                      {showMentions && (
                        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-md border border-border bg-popover shadow-md animate-in fade-in slide-in-from-bottom-2">
                          <div className="p-1">
                            {users.filter((u: any) => `${u.firstname} ${u.lastname}`.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5).map((u: any) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleSelectMention(u)}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                              >
                                <div className="size-6 shrink-0 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                                  {u.firstname[0]}{u.lastname?.[0]}
                                </div>
                                <span className="truncate text-foreground">{u.firstname} {u.lastname}</span>
                              </button>
                            ))}
                            {users.filter((u: any) => `${u.firstname} ${u.lastname}`.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">No users found</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Input 
                        ref={inputRef}
                        value={newComment} 
                        onChange={handleCommentChange}
                        placeholder="Write a comment... (use @ to mention)" 
                        className="pr-10 bg-muted/20"
                        disabled={addCommentMutation.isPending}
                      />
                      <button type="submit" disabled={addCommentMutation.isPending || !newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary disabled:opacity-50">
                        {addCommentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* Sidebar Details */}
                <div className="flex flex-col gap-6 rounded-xl bg-muted/30 p-5 h-fit border border-border/50">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status</h4>
                    <span className="inline-flex items-center rounded-md bg-background border border-border px-3 py-1 text-xs font-semibold shadow-sm">
                      {columns.find((c: any) => parseInt(c.id) === selectedTask.status)?.title || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assignees</h4>
                    {selectedTask.assignees.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {selectedTask.assignees.map((a: any) => (
                          <div key={a.id} className="flex items-center gap-3">
                            <div className="size-7 shrink-0 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
                              {a.initials}
                            </div>
                            <span className="text-sm font-medium leading-tight">{a.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default KanbanPage
