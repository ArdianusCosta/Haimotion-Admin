'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Paperclip, Plus, Send, Clock, MessageSquare, ExternalLink } from 'lucide-react'
import { useKanban } from '../kanban-provider'
import { useQueryClient } from '@tanstack/react-query'
import { pusherClient } from '@/lib/pusher-client'

const isImageFile = (fileName: string, url?: string) => {
  const name = (fileName || '').toLowerCase()
  const u = (url || '').toLowerCase()
  return (
    name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') ||
    name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.svg') ||
    u.startsWith('data:image/') || u.startsWith('blob:') ||
    /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(u)
  )
}

export function KanbanTaskDialog() {
  const { 
    columns, users, currentUser,
    isDetailsDialogOpen, setIsDetailsDialogOpen,
    selectedTask, taskDetails, detailsLoading,
    addCommentMutation, uploadAttachmentMutation
  } = useKanban()

  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)

  // Auto-scroll comments to bottom when dialog opens or comments change
  useEffect(() => {
    if (isDetailsDialogOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    }
  }, [isDetailsDialogOpen, selectedTask?.dbId, taskDetails.comments.length])

  // Real-time Pusher listener for incoming task comments
  useEffect(() => {
    if (!selectedTask?.dbId || !isDetailsDialogOpen) return

    const channelName = `private-task-${selectedTask.dbId}`
    const channel = pusherClient.subscribe(channelName)

    channel.bind('comment:created', (newComment: any) => {
      queryClient.setQueryData(['taskDetails', selectedTask.dbId], (old: any) => {
        if (!old) return old
        const comments = old.comments || []
        
        // Skip duplicate if already received
        if (comments.some((c: any) => c.id === newComment.id)) {
          return old
        }

        // Replace pending temp comment if matches current user
        const tempIdx = comments.findIndex(
          (c: any) => typeof c.id === 'string' && c.id.startsWith('temp-') && c.comment === newComment.comment
        )
        if (tempIdx !== -1) {
          const next = [...comments]
          next[tempIdx] = { ...newComment, is_pending: false }
          return { ...old, comments: next }
        }

        return {
          ...old,
          comments: [...comments, newComment]
        }
      })

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [selectedTask?.dbId, isDetailsDialogOpen, queryClient])

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !selectedTask) return
    const commentText = newComment.trim()
    setNewComment('')
    setShowMentions(false)

    const userId = currentUser?.id ? Number(currentUser.id) : 1
    const tempId = `temp-${Date.now()}`

    // Format current user's display name and initials for instant preview
    const uName = currentUser?.name || `${currentUser?.firstname || ''} ${currentUser?.lastname || ''}`.trim() || 'You'
    let initials = 'ME'
    if (currentUser?.firstname) {
      initials = `${currentUser.firstname[0]}${currentUser.lastname?.[0] || ''}`.toUpperCase()
    } else if (currentUser?.name) {
      const parts = currentUser.name.split(/\s+/).filter(Boolean)
      initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : currentUser.name.slice(0, 2).toUpperCase()
    }

    const optimisticComment = {
      id: tempId,
      task_id: selectedTask.dbId,
      user_id: userId,
      comment: commentText,
      created_at: new Date().toISOString(),
      is_pending: true,
      user: {
        name: uName,
        initials,
        avatar: currentUser?.avatar
      }
    }

    // 0ms instant display in UI
    queryClient.setQueryData(['taskDetails', selectedTask.dbId], (old: any) => {
      if (!old) return old
      return {
        ...old,
        comments: [...(old.comments || []), optimisticComment]
      }
    })

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 20)

    // Trigger backend mutation
    addCommentMutation.mutate({ taskId: selectedTask.dbId, userId, text: commentText, tempId })
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedTask) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (currentUser?.id) {
        formData.append('userId', String(currentUser.id))
      }

      let fileUrl = ''
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) fileUrl = data.url
      } else {
        // Fallback to /api/upload
        const res2 = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        if (res2.ok) {
          const data2 = await res2.json()
          if (data2.url) fileUrl = data2.url
        }
      }

      if (fileUrl) {
        uploadAttachmentMutation.mutate({ taskId: selectedTask.dbId, url: fileUrl, name: file.name })
      }
    } catch (err) {
      console.error('File upload error:', err)
    } finally {
      e.target.value = ''
    }
  }

  const taskStatusColumn = columns.find((c: any) => parseInt(c.id) === selectedTask?.status)

  return (
    <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
      <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] h-[670px] flex flex-col p-6 overflow-hidden border-border/60 shadow-2xl">
        {selectedTask && (
          <>
            <DialogHeader className="shrink-0 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between pr-8">
                <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.tagColor}`}>{selectedTask.tag}</span>
                <span className="text-xs text-muted-foreground">Created {selectedTask.date}</span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight mt-1.5">{selectedTask.title}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
              {/* LEFT COLUMN: Description + Attachments + (Status & Assignees at bottom) */}
              <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1">
                {/* Description */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3 max-h-[140px] overflow-y-auto">
                    <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap select-text">
                      {selectedTask.description || <span className="text-muted-foreground italic">No description provided.</span>}
                    </p>
                  </div>
                </div>
                
                {/* Attachments */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      Attachments {detailsLoading && <Loader2 className="size-3 animate-spin" />} 
                      {!detailsLoading && `(${taskDetails.attachments.length})`}
                    </h3>
                    <div>
                      <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploadAttachmentMutation.isPending} />
                      <label htmlFor="file-upload" className={`cursor-pointer text-xs font-medium flex items-center gap-1 text-primary hover:underline ${uploadAttachmentMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadAttachmentMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />} Add file
                      </label>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5 max-h-[280px] overflow-y-auto">
                    {taskDetails.attachments.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {taskDetails.attachments.map((att: any) => {
                          const isImg = isImageFile(att.file_name, att.file_url)
                          return (
                            <div 
                              key={att.id} 
                              className="flex flex-col p-2.5 rounded-lg border border-border/40 bg-background/70 text-xs transition-all shadow-2xs"
                            >
                              {/* Attachment Row Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                                  <a 
                                    href={att.file_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="font-medium hover:text-primary transition-colors truncate block text-xs"
                                    title={att.file_name}
                                  >
                                    {att.file_name}
                                  </a>
                                </div>
                                <a 
                                  href={att.file_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
                                  title="Buka berkas di tab baru"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              </div>

                              {/* Direct Inline Image Preview directly underneath */}
                              {isImg && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-black/40 flex items-center justify-center p-1">
                                  <a
                                    href={att.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block max-h-52 w-full cursor-zoom-in"
                                    title="Klik untuk membuka ukuran penuh di tab baru"
                                  >
                                    <img 
                                      src={att.file_url} 
                                      alt={att.file_name} 
                                      className="max-h-52 w-auto max-w-full mx-auto object-contain rounded" 
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </a>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground px-1 py-0.5">No attachments.</p>
                    )}
                  </div>
                </div>

                {/* Status & Assignees (Placed at bottom of left column, replacing old comments position) */}
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col gap-4 mt-auto shrink-0 shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Section */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-primary" /> Status
                      </h4>
                      <div className="inline-flex items-center gap-2 rounded-lg bg-background border border-border/60 px-3 py-1.5 text-xs font-semibold shadow-xs">
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                        {taskStatusColumn?.title || 'Pending'}
                      </div>
                    </div>

                    {/* Assignees Section */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-primary" /> Assignees
                      </h4>
                      {selectedTask.assignees.length > 0 ? (
                        <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                          {selectedTask.assignees.map((a: any) => (
                            <div key={a.id} className="flex items-center gap-2 p-1.5 px-2 rounded-lg bg-background/60 border border-border/40 shadow-xs">
                              <div className="size-5 shrink-0 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shadow-sm">
                                {a.initials}
                              </div>
                              <span className="text-xs font-medium leading-tight truncate">{a.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Full-Height Dedicated Chat / Comments */}
              <div className="flex flex-col h-full rounded-xl border border-border/50 bg-muted/20 p-4 overflow-hidden shadow-xs">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comments</h3>
                    <span className="text-[11px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      {detailsLoading ? <Loader2 className="size-3 animate-spin inline" /> : taskDetails.comments.length}
                    </span>
                  </div>
                </div>

                {/* Comments Message Feed */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 my-3 min-h-0">
                  {taskDetails.comments.map((comment: any) => {
                    const isMe = currentUser ? Number(comment.user_id) === Number(currentUser.id) : false;
                    const avatarUrl = comment.user?.avatar 
                      ? (comment.user.avatar.startsWith('http') || comment.user.avatar.startsWith('/') 
                          ? comment.user.avatar 
                          : `/avatars/${comment.user.avatar}`) 
                      : null;
                    const isPending = !!comment.is_pending;

                    return (
                      <div key={comment.id} className={`flex gap-2.5 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="size-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold shrink-0 text-primary-foreground shadow-sm overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={comment.user?.name || ''} className="size-full object-cover" />
                            ) : (
                              comment.user?.initials || `U${comment.user_id}`
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                          <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-xs font-semibold">{comment.user?.name || `User ${comment.user_id}`}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 text-primary">
                                  <Clock className="size-3 animate-spin" /> sending...
                                </span>
                              ) : (
                                new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              )}
                            </span>
                          </div>
                          <div className={`text-xs mt-0.5 whitespace-pre-wrap rounded-2xl px-3.5 py-2 shadow-sm border transition-all ${
                            isMe 
                            ? 'bg-primary text-primary-foreground border-primary rounded-tr-none' 
                            : 'bg-background/80 text-foreground border-border/70 rounded-tl-none'
                          } ${isPending ? 'opacity-85' : 'opacity-100'}`}>
                            {comment.comment.split(/(@\w+(?: \w+)?)/g).map((part: string, i: number) => 
                              part.startsWith('@') ? <span key={i} className={isMe ? 'font-semibold opacity-95' : 'text-primary font-semibold'}>{part}</span> : part
                            )}
                          </div>
                        </div>
                        {isMe && (
                          <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0 text-primary border border-primary/30 shadow-sm overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={comment.user?.name || ''} className="size-full object-cover" />
                            ) : (
                              comment.user?.initials || `U${comment.user_id}`
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {!detailsLoading && taskDetails.comments.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-center gap-2">
                      <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                        <MessageSquare className="size-5" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">No comments yet.</p>
                      <p className="text-[11px] text-muted-foreground/70">Start the conversation or use @ to mention teammates.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Add Comment Input Form */}
                <form onSubmit={handleAddComment} className="relative mt-auto pt-2 border-t border-border/40 shrink-0">
                  {showMentions && (
                    <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-md border border-border bg-popover shadow-xl animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-1">
                        {users.filter((u: any) => `${u.firstname} ${u.lastname}`.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5).map((u: any) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectMention(u)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted text-left"
                          >
                            <div className="size-6 shrink-0 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                              {u.firstname[0]}{u.lastname?.[0]}
                            </div>
                            <span className="truncate text-foreground font-medium">{u.firstname} {u.lastname}</span>
                          </button>
                        ))}
                        {users.filter((u: any) => `${u.firstname} ${u.lastname}`.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">No users found</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative flex items-center">
                    <Input 
                      ref={inputRef}
                      value={newComment} 
                      onChange={handleCommentChange}
                      placeholder="Write a comment... (use @ to mention)" 
                      className="pr-10 bg-background/60 h-10 text-xs rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <button 
                      type="submit" 
                      disabled={!newComment.trim()} 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:bg-transparent disabled:text-muted-foreground hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Send className="size-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
