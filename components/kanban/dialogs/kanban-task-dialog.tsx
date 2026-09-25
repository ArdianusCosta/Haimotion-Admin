import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Paperclip, Plus, Send } from 'lucide-react'
import { useKanban } from '../kanban-provider'

export function KanbanTaskDialog() {
  const { 
    columns, users,
    isDetailsDialogOpen, setIsDetailsDialogOpen,
    selectedTask, taskDetails, detailsLoading,
    addCommentMutation, uploadAttachmentMutation
  } = useKanban()

  const [newComment, setNewComment] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !selectedTask) return
    const userId = 1 // Demo user ID
    addCommentMutation.mutate({ taskId: selectedTask.dbId, userId, text: newComment })
    setNewComment('')
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

  return (
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
  )
}
