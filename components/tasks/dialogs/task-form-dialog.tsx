'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Tag, X, Inbox, CalendarIcon, FolderDot, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TASK_STATUS_MAP } from '@/types/tasks'
import { useTasks } from '../tasks-provider'
import { useTaskComments } from '@/hooks/use-task-comments'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function getStatusDot(status: number) {
  switch (status) {
    case 0: return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' // Pending
    case 1: return 'bg-slate-400' // To Do
    case 6: return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' // Started
    case 2: return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' // In Progress
    case 3: return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' // In Review
    case 4: return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' // Revisions
    case 7: return 'bg-yellow-600' // Hold
    case 8: return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' // Overdue
    case 5: return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' // Done
    default: return 'bg-primary'
  }
}

export function TaskFormDialog({ 
  formData, setFormData, 
  handleSaveTask, 
  saveTaskMutation 
}: { 
  formData: any, 
  setFormData: any,
  handleSaveTask: (e: React.FormEvent) => void,
  saveTaskMutation: any
}) {
  const { taskDialogOpen, setTaskDialogOpen, projects, users, currentUserId } = useTasks()
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
  const todayStr = new Date().toISOString().split('T')[0]

  const {
    comments, newComment, setNewComment,
    replyToId, setReplyToId,
    mentionOpen, setMentionOpen,
    mentionSearch, setMentionSearch,
    commentsEndRef, postCommentMut
  } = useTaskComments(formData.id, taskDialogOpen)

  return (
    <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
      <DialogContent className={`${formData.id > 0 ? "sm:max-w-4xl w-[95vw]" : "sm:max-w-[520px]"} p-0 overflow-hidden border-border/60 shadow-2xl`}>
        <div className={formData.id > 0 ? "flex flex-col md:flex-row h-full max-h-[85vh]" : "max-h-[85vh] overflow-y-auto"}>
          
          {/* Left Column (Task Form) */}
          <form onSubmit={handleSaveTask} className={`flex flex-col bg-background/50 backdrop-blur-sm min-w-0 ${formData.id > 0 ? 'flex-1 w-full overflow-y-auto custom-scrollbar' : 'p-6'}`}>
            <div className={formData.id > 0 ? "p-6 pb-4 border-b border-border/40" : "pb-4"}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">{formData.id ? 'Task Details' : 'Create Task'}</DialogTitle>
                {formData.id > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Manage task details, assignees, and status.
                  </div>
                )}
              </DialogHeader>
            </div>
            
            <div className={`flex flex-col gap-6 ${formData.id > 0 ? "p-6" : ""}`}>
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">Basic Information</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground">Task Title</Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    placeholder="E.g., Update landing page copy" 
                    className="bg-card/50 text-sm font-medium h-10 rounded-lg border-border/60 transition-all focus:bg-background shadow-xs"
                  />
                </div>
                
                {/* 2-Column Row for Project & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {/* Project Selector */}
                  <div className="flex flex-col gap-2 min-w-0">
                    <Label htmlFor="project" className="text-xs font-semibold text-muted-foreground">Project</Label>
                    <Select 
                      value={formData.projectId ? formData.projectId.toString() : ""} 
                      onValueChange={(v) => setFormData({...formData, projectId: parseInt(v)})}
                    >
                      <SelectTrigger className="!w-full !h-10 bg-card/50 border-border/60 rounded-lg shadow-xs transition-colors hover:bg-card/80 px-3">
                        <div className="flex items-center gap-2 text-foreground min-w-0 flex-1 overflow-hidden">
                          <FolderDot className="size-4 text-primary shrink-0" />
                          <SelectValue placeholder="Select project...">
                            {(val: any) => {
                              const pId = val || (formData.projectId ? formData.projectId.toString() : '')
                              const proj = projects.find((p: any) => Number(p.id) === Number(pId))
                              return (
                                <span className="truncate text-xs sm:text-sm font-medium text-foreground">
                                  {proj?.name || (pId ? `Project #${pId}` : 'Select project...')}
                                </span>
                              )
                            }}
                          </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {projects.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()} className="cursor-pointer">
                            <div className="flex items-center gap-2.5 py-0.5 truncate">
                              <FolderDot className="size-3.5 text-primary shrink-0" />
                              <span className="truncate font-medium text-xs sm:text-sm">{p.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Status Selector */}
                  <div className="flex flex-col gap-2 min-w-0">
                    <Label htmlFor="status" className="text-xs font-semibold text-muted-foreground">Status</Label>
                    <Select 
                      value={formData.status !== undefined && formData.status !== null ? formData.status.toString() : "0"} 
                      onValueChange={(v) => setFormData({...formData, status: parseInt(v)})}
                    >
                      <SelectTrigger className="!w-full !h-10 bg-card/50 border-border/60 rounded-lg shadow-xs transition-colors hover:bg-card/80 px-3">
                        <div className="flex items-center gap-2 text-foreground min-w-0 flex-1 overflow-hidden">
                          <SelectValue placeholder="Select status...">
                            {(val: any) => {
                              const sId = val !== undefined && val !== null && val !== "" ? parseInt(val) : formData.status
                              const label = TASK_STATUS_MAP[sId] || 'Pending'
                              return (
                                <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                                  <span className={`size-2 rounded-full shrink-0 ${getStatusDot(sId)}`} />
                                  <span className="truncate">{label}</span>
                                </span>
                              )
                            }}
                          </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {Object.entries(TASK_STATUS_MAP).map(([val, label]) => {
                          const num = parseInt(val)
                          return (
                            <SelectItem key={val} value={val} className="cursor-pointer">
                              <div className="flex items-center gap-2.5 py-0.5">
                                <span className={`size-2 rounded-full shrink-0 ${getStatusDot(num)}`} />
                                <span className="font-medium text-xs sm:text-sm">{label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Section 2: Schedule */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">Schedule</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-2 min-w-0">
                    <Label className="text-xs font-semibold text-muted-foreground">Start Date</Label>
                    <div className="relative">
                       <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                       <Input disabled value={todayStr} type="text" className="pl-9 h-10 opacity-60 cursor-not-allowed bg-muted/20 border-border/50 text-xs sm:text-sm rounded-lg" title="Auto-generated start date" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <Label htmlFor="dueDate" className="text-xs font-semibold text-muted-foreground">Due Date</Label>
                    <div className="relative">
                      <Input 
                        id="dueDate" 
                        type="date"
                        value={formData.dueDate} 
                        onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                        className="h-10 bg-card/50 border-border/60 text-xs sm:text-sm rounded-lg shadow-xs transition-colors focus:bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Assignment */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">Assignment</h3>
                </div>

                <div className="flex flex-col gap-2 relative assignee-dropdown-container">
                  <Label className="text-xs font-semibold text-muted-foreground">Assignees</Label>
                  <div 
                    className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-xs shadow-xs transition-colors hover:bg-card hover:border-primary/50 cursor-pointer"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    {formData.assignees.length === 0 && <span className="text-muted-foreground">Select team members...</span>}
                    {formData.assignees.map((id: number) => {
                      const u = users.find((u: any) => Number(u.id) === Number(id))
                      if (!u) return null
                      return (
                        <span key={id} className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20 shadow-xs">
                          <Avatar className="size-4">
                            <AvatarFallback className="bg-transparent text-[8px] font-bold">{u.name[0]}</AvatarFallback>
                          </Avatar>
                          {u.name}
                          <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            setFormData({...formData, assignees: formData.assignees.filter((a: number) => Number(a) !== Number(id))})
                          }} className="ml-1 hover:text-destructive transition-colors"><X className="size-3" /></button>
                        </span>
                      )
                    })}
                  </div>
                  
                  {showAssigneeDropdown && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-48 w-full overflow-hidden rounded-xl border border-border/80 bg-popover shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2 border-b border-border/50 sticky top-0 bg-popover/95 backdrop-blur z-10">
                        <input 
                          autoFocus
                          placeholder="Search team members..." 
                          value={assigneeSearchQuery}
                          onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                          className="w-full rounded-md bg-muted/50 py-1.5 px-3 text-xs outline-none transition-colors focus:bg-background focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="overflow-y-auto p-1 max-h-36 custom-scrollbar">
                        {users.filter((u: any) => u.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())).map((u: any) => {
                          const isSelected = formData.assignees.some((id: number) => Number(id) === Number(u.id))
                          return (
                            <div 
                              key={u.id}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-muted ${isSelected ? 'bg-muted/70 font-medium' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({...formData, assignees: formData.assignees.filter((id: number) => Number(id) !== Number(u.id))})
                                } else {
                                  setFormData({...formData, assignees: [...formData.assignees, Number(u.id)]})
                                }
                                setShowAssigneeDropdown(false)
                                setAssigneeSearchQuery('')
                              }}
                            >
                              <div className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background/50'}`}>
                                 {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                              <Avatar className="size-5 border border-border/50">
                                  <AvatarFallback className="bg-primary/10 text-[8px] font-bold text-primary">{u.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="truncate">{u.name}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Additional Details */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90">Additional Details</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">Description</Label>
                  <textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="flex min-h-[90px] w-full rounded-lg border border-border/60 bg-card/50 p-3 text-xs leading-relaxed ring-offset-background placeholder:text-muted-foreground/70 outline-none transition-all focus:bg-background focus-visible:ring-1 focus-visible:ring-primary custom-scrollbar shadow-xs"
                    placeholder="Provide a detailed description of the task..."
                  />
                </div>
              </div>

            </div>
            
            {/* Sticky Form Footer Bar */}
            <div className={`mt-auto sticky bottom-0 bg-background/95 backdrop-blur-xs border-t border-border/40 p-4 px-6 flex justify-end gap-2.5 shrink-0 ${formData.id === 0 ? "rounded-b-lg" : ""}`}>
              <Button type="button" variant="outline" size="sm" className="h-9 px-4 font-medium border-border/60 hover:bg-muted transition-colors cursor-pointer" onClick={() => setTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9 px-5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors cursor-pointer" disabled={saveTaskMutation.isPending}>
                {saveTaskMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Task
              </Button>
            </div>
          </form>

          {/* Right Column (Comments UI) */}
          {formData.id > 0 && (
            <div className="w-full md:w-[380px] shrink-0 flex flex-col h-full border-t md:border-t-0 md:border-l border-border/50 bg-card/20">
              {/* Header */}
              <div className="flex items-center justify-between p-4 px-5 border-b border-border/40 bg-background/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comments</Label>
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                    {comments.length}
                  </span>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pb-2">
                {comments.length > 0 ? (
                  (() => {
                    const rootComments = comments.filter(c => !c.parent_id);
                    return rootComments.map(comment => {
                      const commentUser = users.find((u: any) => Number(u.id) === Number(comment.user_id));
                      const avatarFallback = commentUser?.name ? commentUser.name[0].toUpperCase() : 'U';
                      const replies = comments.filter(c => c.parent_id === comment.id);
                      
                      const isMine = Number(comment.user_id) === currentUserId;

                      return (
                        <div key={comment.id} className="space-y-2.5">
                          <div className={`flex gap-2.5 text-xs group ${isMine ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="size-7 shrink-0 mt-0.5 border border-border/50 shadow-xs">
                              <AvatarFallback className="bg-muted text-[10px] font-bold">{avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                              <div className={`flex items-center gap-1.5 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <span className="font-semibold text-xs text-foreground">{commentUser?.name || 'Unknown User'}</span>
                                <span className="text-[10px] text-muted-foreground/70">
                                  {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <div className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs border ${
                                isMine 
                                ? 'bg-primary text-primary-foreground border-primary rounded-tr-none' 
                                : 'bg-card text-foreground border-border/50 rounded-tl-none'
                              }`}>
                                {comment.comment.split(/(@\w+(?:\s\w+)?)/g).map((part: string, i: number) => 
                                  part.startsWith('@') ? <span key={i} className={`font-semibold px-1 rounded-sm ${isMine ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary'}`}>{part}</span> : part
                                )}
                              </div>
                              <button 
                                onClick={() => setReplyToId(comment.id)} 
                                className={`text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 mt-1 cursor-pointer ${isMine ? 'mr-1' : 'ml-1'}`}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                          
                          {replies.length > 0 && (
                            <div className="space-y-3 mt-2 pl-9 border-l-2 border-border/30 ml-3">
                              {replies.map(reply => {
                                const replyUser = users.find((u: any) => Number(u.id) === Number(reply.user_id));
                                const rFallback = replyUser?.name ? replyUser.name[0].toUpperCase() : 'U';
                                const isReplyMine = Number(reply.user_id) === currentUserId;
                                
                                return (
                                  <div key={reply.id} className={`flex gap-2 text-xs group pl-3 ${isReplyMine ? 'flex-row-reverse' : ''}`}>
                                    <Avatar className="size-5 shrink-0 mt-0.5 border border-border/50">
                                      <AvatarFallback className="bg-muted text-[9px] font-bold">{rFallback}</AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col ${isReplyMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                      <div className={`flex items-center gap-1.5 mb-1 ${isReplyMine ? 'flex-row-reverse' : ''}`}>
                                        <span className="font-medium text-[11px] text-foreground/90">{replyUser?.name || 'Unknown User'}</span>
                                        <span className="text-[9px] text-muted-foreground/60">
                                          {new Date(reply.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      </div>
                                      <div className={`px-3 py-1.5 text-xs rounded-xl leading-relaxed shadow-xs border ${
                                        isReplyMine 
                                        ? 'bg-primary/95 text-primary-foreground border-primary rounded-tr-none' 
                                        : 'bg-card text-foreground border-border/50 rounded-tl-none'
                                      }`}>
                                        {reply.comment.split(/(@\w+(?:\s\w+)?)/g).map((part: string, i: number) => 
                                          part.startsWith('@') ? <span key={i} className={`font-semibold px-1 rounded-sm ${isReplyMine ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary'}`}>{part}</span> : part
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
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-70 px-4 py-8">
                    <div className="size-12 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center mb-3">
                      <Inbox className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-semibold">No comments yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">Discuss this task, mention colleagues, and track updates.</p>
                  </div>
                )}
                <div ref={commentsEndRef} className="h-2" />
              </div>

              {/* Comment Input Area */}
              <div className="p-4 pt-2 shrink-0 bg-background/50 backdrop-blur-sm border-t border-border/40 relative">
                {replyToId && (
                  <div className="flex items-center justify-between bg-primary/5 px-3 py-1.5 rounded-t-lg text-xs border border-b-0 border-primary/20 -mb-1 pb-2 relative z-0">
                    <span className="text-primary font-medium flex items-center gap-1.5 text-[11px]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                      Replying to comment...
                    </span>
                    <button onClick={() => setReplyToId(null)} className="hover:bg-primary/10 rounded-full p-0.5 text-primary"><X className="size-3" /></button>
                  </div>
                )}
                
                {mentionOpen && (
                  <div className="absolute bottom-[calc(100%-8px)] left-4 right-4 mb-2 max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-popover shadow-xl custom-scrollbar z-50 animate-in slide-in-from-bottom-2">
                    {users.filter((u: any) => u.name.toLowerCase().includes(mentionSearch.toLowerCase())).map((u: any) => (
                      <div 
                        key={u.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                        onClick={() => {
                          const beforeMention = newComment.substring(0, newComment.lastIndexOf('@'));
                          setNewComment(beforeMention + '@' + u.name + ' ');
                          setMentionOpen(false);
                          setMentionSearch('');
                        }}
                      >
                        <Avatar className="size-5 shrink-0 border border-border/50">
                          <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">{u.name[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    ))}
                    {users.filter((u: any) => u.name.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-3 text-center text-xs text-muted-foreground">No team members found</div>
                    )}
                  </div>
                )}

                <div className="relative flex flex-col rounded-xl border border-border/60 bg-card focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 overflow-hidden transition-all shadow-xs z-10">
                  <textarea 
                    placeholder="Write a comment... (Type @ to mention)"
                    value={newComment}
                    onChange={e => {
                      const val = e.target.value;
                      setNewComment(val);
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
                    className="min-h-[70px] w-full resize-none bg-transparent px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/70 custom-scrollbar"
                  />
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/15 border-t border-border/30">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { setMentionOpen(true); setNewComment(newComment + '@'); }} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Mention user">
                        <Tag className="size-3.5" />
                      </button>
                    </div>
                    <Button 
                      type="button" 
                      size="sm"
                      className="h-7 text-[11px] font-semibold px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                      onClick={() => postCommentMut.mutate()}
                      disabled={!newComment.trim() || postCommentMut.isPending}
                    >
                      {postCommentMut.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </DialogContent>
    </Dialog>
  )
}
