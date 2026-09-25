import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Tag, X, Inbox, CalendarIcon, FolderDot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TASK_STATUS_MAP } from '@/types/tasks'
import { useTasks } from '../tasks-provider'
import { useTaskComments } from '@/hooks/use-task-comments'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
      <DialogContent className={`${formData.id > 0 ? "sm:max-w-4xl w-[95vw]" : "sm:max-w-[500px]"} p-0 overflow-hidden border-border/60 shadow-2xl`}>
        <div className={formData.id > 0 ? "flex flex-col md:flex-row h-full max-h-[85vh]" : "max-h-[85vh] overflow-y-auto"}>
          
          {/* Left Column (Task Form) */}
          <form onSubmit={handleSaveTask} className={`flex flex-col bg-background/50 backdrop-blur-sm ${formData.id > 0 ? 'flex-1 w-full overflow-y-auto custom-scrollbar' : 'p-6'}`}>
            <div className={formData.id > 0 ? "p-6 pb-2" : "pb-4"}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{formData.id ? 'Task Details' : 'Create Task'}</DialogTitle>
                {formData.id > 0 && (
                  <div className="text-xs text-muted-foreground mt-1.5">
                    Manage task details, assignees, and status.
                  </div>
                )}
              </DialogHeader>
            </div>
            
            <div className={`grid gap-5 ${formData.id > 0 ? "px-6 pb-6" : ""}`}>
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                  placeholder="E.g., Update landing page copy" 
                  className="bg-card/50 text-base font-medium h-11 transition-all focus:bg-background shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="project" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</Label>
                  <Select 
                    value={formData.projectId ? formData.projectId.toString() : ""} 
                    onValueChange={(v) => setFormData({...formData, projectId: parseInt(v)})}
                  >
                    <SelectTrigger className="w-full bg-card/50 h-10 shadow-sm transition-all focus:bg-background">
                      <div className="flex items-center gap-2 text-foreground">
                         <FolderDot className="size-4 text-muted-foreground" />
                         <SelectValue placeholder="Select project..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select 
                    value={formData.status.toString()} 
                    onValueChange={(v) => setFormData({...formData, status: parseInt(v)})}
                  >
                    <SelectTrigger className="w-full bg-card/50 h-10 shadow-sm transition-all focus:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_STATUS_MAP).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                  <div className="relative">
                     <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                     <Input disabled value={todayStr} type="text" className="pl-9 h-10 opacity-50 cursor-not-allowed bg-muted/30 border-dashed" title="Auto-generated" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</Label>
                  <div className="relative">
                    <Input 
                      id="dueDate" 
                      type="date"
                      value={formData.dueDate} 
                      onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                      className="h-10 bg-card/50 shadow-sm transition-all focus:bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 relative assignee-dropdown-container">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignees</Label>
                <div 
                  className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card/50 px-3 py-2 text-sm shadow-sm transition-all hover:bg-card hover:border-primary/50 cursor-pointer"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                >
                  {formData.assignees.length === 0 && <span className="text-muted-foreground">Select team members...</span>}
                  {formData.assignees.map((id: number) => {
                    const u = users.find((u: any) => Number(u.id) === Number(id))
                    if (!u) return null
                    return (
                      <span key={id} className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary border border-primary/20 transition-colors">
                        <Avatar className="size-4">
                          <AvatarFallback className="bg-transparent text-[8px] font-bold">{u.name[0]}</AvatarFallback>
                        </Avatar>
                        {u.name}
                        <button type="button" onClick={(e) => {
                          e.stopPropagation();
                          setFormData({...formData, assignees: formData.assignees.filter((a: number) => Number(a) !== Number(id))})
                        }} className="ml-0.5 hover:text-destructive transition-colors"><X className="size-3" /></button>
                      </span>
                    )
                  })}
                </div>
                
                {showAssigneeDropdown && (
                  <div className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-48 w-full overflow-hidden rounded-xl border border-border/80 bg-popover shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-border/50 sticky top-0 bg-popover/95 backdrop-blur z-10">
                      <input 
                        autoFocus
                        placeholder="Search team members..." 
                        value={assigneeSearchQuery}
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        className="w-full rounded-md bg-muted/50 py-2 px-3 text-sm outline-none transition-colors focus:bg-background focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="overflow-y-auto p-1.5 max-h-36 custom-scrollbar">
                      {users.filter((u: any) => u.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())).map((u: any) => {
                        const isSelected = formData.assignees.some((id: number) => Number(id) === Number(u.id))
                        return (
                          <div 
                            key={u.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${isSelected ? 'bg-muted/60' : ''}`}
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
                            <Avatar className="size-6 border border-border/50">
                                <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className={isSelected ? 'font-medium' : ''}>{u.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                <textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="flex min-h-[120px] w-full rounded-lg border border-input bg-card/50 p-3 text-sm ring-offset-background placeholder:text-muted-foreground outline-none transition-all focus:bg-background focus-visible:ring-1 focus-visible:ring-primary custom-scrollbar shadow-sm"
                  placeholder="Provide a detailed description of the task..."
                />
              </div>

            </div>
            
            <div className={`mt-auto sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/40 p-5 ${formData.id === 0 ? "rounded-b-lg" : ""}`}>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="shadow-sm font-medium" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="shadow-sm font-medium px-6" disabled={saveTaskMutation.isPending}>
                  {saveTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Task
                </Button>
              </div>
            </div>
          </form>

          {/* Right Column (Comments UI) */}
          {formData.id > 0 && (
            <div className="w-full md:w-[380px] shrink-0 flex flex-col h-full border-t md:border-t-0 md:border-l border-border/50 bg-card/30">
              <div className="flex items-center gap-2 p-5 border-b border-border/40 bg-background/50 backdrop-blur-sm shrink-0">
                <Label className="text-base font-semibold">Comments</Label>
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {comments.length}
                </span>
              </div>

              {/* Comments List */}
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-5 pb-0">
                {comments.length > 0 ? (
                  (() => {
                    const rootComments = comments.filter(c => !c.parent_id);
                    return rootComments.map(comment => {
                      const commentUser = users.find((u: any) => Number(u.id) === Number(comment.user_id));
                      const avatarFallback = commentUser?.name ? commentUser.name[0].toUpperCase() : 'U';
                      const replies = comments.filter(c => c.parent_id === comment.id);
                      
                      const isMine = Number(comment.user_id) === currentUserId;

                      return (
                        <div key={comment.id} className="space-y-3">
                          <div className={`flex gap-3 text-sm group ${isMine ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="size-8 shrink-0 mt-0.5 border border-border/50 shadow-sm">
                              <AvatarFallback className="bg-muted text-xs font-bold">{avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                              <div className={`flex items-center gap-2 mb-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <span className="font-semibold text-xs text-foreground">{commentUser?.name || 'Unknown User'}</span>
                                <span className="text-[10px] font-medium text-muted-foreground/70">
                                  {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                                isMine 
                                ? 'bg-primary text-primary-foreground border-primary/20 rounded-tr-sm' 
                                : 'bg-card text-foreground border-border/40 rounded-tl-sm'
                              }`}>
                                {comment.comment.split(/(@\w+(?:\s\w+)?)/g).map((part: string, i: number) => 
                                  part.startsWith('@') ? <span key={i} className={`font-semibold px-1 rounded-sm ${isMine ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}`}>{part}</span> : part
                                )}
                              </div>
                              <button 
                                onClick={() => setReplyToId(comment.id)} 
                                className={`text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 mt-1.5 ${isMine ? 'mr-1' : 'ml-1'}`}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                          
                          {replies.length > 0 && (
                            <div className="space-y-4 mt-3 pl-11 border-l-2 border-border/30 ml-4">
                              {replies.map(reply => {
                                const replyUser = users.find((u: any) => Number(u.id) === Number(reply.user_id));
                                const rFallback = replyUser?.name ? replyUser.name[0].toUpperCase() : 'U';
                                const isReplyMine = Number(reply.user_id) === currentUserId;
                                
                                return (
                                  <div key={reply.id} className={`flex gap-3 text-sm group pl-4 ${isReplyMine ? 'flex-row-reverse' : ''}`}>
                                    <Avatar className="size-6 shrink-0 mt-0.5 border border-border/50">
                                      <AvatarFallback className="bg-muted text-[10px] font-bold">{rFallback}</AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col ${isReplyMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                      <div className={`flex items-center gap-2 mb-1 ${isReplyMine ? 'flex-row-reverse' : ''}`}>
                                        <span className="font-medium text-xs text-foreground/90">{replyUser?.name || 'Unknown User'}</span>
                                        <span className="text-[10px] text-muted-foreground/60">
                                          {new Date(reply.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      </div>
                                      <div className={`px-3 py-2 text-xs rounded-xl leading-relaxed shadow-sm border ${
                                        isReplyMine 
                                        ? 'bg-primary/90 text-primary-foreground border-primary/20 rounded-tr-sm' 
                                        : 'bg-card text-foreground border-border/40 rounded-tl-sm'
                                      }`}>
                                        {reply.comment.split(/(@\w+(?:\s\w+)?)/g).map((part: string, i: number) => 
                                          part.startsWith('@') ? <span key={i} className={`font-semibold px-1 rounded-sm ${isReplyMine ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}`}>{part}</span> : part
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
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-70 px-4">
                    <div className="size-16 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center mb-4">
                      <Inbox className="size-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">No comments yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Discuss this task, mention colleagues, and keep track of progress.</p>
                  </div>
                )}
                <div ref={commentsEndRef} className="h-4" />
              </div>

              {/* Comment Input Area */}
              <div className="p-4 pt-2 shrink-0 bg-background/50 backdrop-blur-sm border-t border-border/40 relative">
                {replyToId && (
                  <div className="flex items-center justify-between bg-primary/5 px-3 py-2 rounded-t-xl text-xs border border-b-0 border-primary/20 -mb-1 pb-3 relative z-0">
                    <span className="text-primary font-medium flex items-center gap-1.5">
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
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted"
                        onClick={() => {
                          const beforeMention = newComment.substring(0, newComment.lastIndexOf('@'));
                          setNewComment(beforeMention + '@' + u.name + ' ');
                          setMentionOpen(false);
                          setMentionSearch('');
                        }}
                      >
                        <Avatar className="size-6 shrink-0 border border-border/50">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{u.name[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    ))}
                    {users.filter((u: any) => u.name.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">No team members found</div>
                    )}
                  </div>
                )}

                <div className="relative flex flex-col rounded-xl border border-border bg-card focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 overflow-hidden transition-all shadow-sm z-10">
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
                    className="min-h-[80px] w-full resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/70 custom-scrollbar"
                  />
                  <div className="flex items-center justify-between px-2 py-2 bg-muted/10 border-t border-border/30">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { setMentionOpen(true); setNewComment(newComment + '@'); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Mention user">
                        <Tag className="size-4" />
                      </button>
                    </div>
                    <Button 
                      type="button" 
                      size="sm"
                      className="h-8 text-xs font-semibold px-4 rounded-lg"
                      onClick={() => postCommentMut.mutate()}
                      disabled={!newComment.trim() || postCommentMut.isPending}
                    >
                      {postCommentMut.isPending ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
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
