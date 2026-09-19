'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, MoreHorizontal, Paperclip, Phone, Search, Send, Smile, Video, UserPlus, Reply, Download, X, Check, CheckCheck, ChevronLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConversations, getMessages, sendMessage, createCallSession, searchUsers, getOrCreateThread, triggerTyping, markThreadAsRead } from '@/app/actions/chat'
import { pusherClient } from '@/lib/pusher-client'
import { LiveKitCallUI } from './livekit-call'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'

export function ChatPage({ onStartCall }: { onStartCall?: (threadId: number, type: 'voice' | 'video') => void }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingTime = useRef<number>(0)
  
  // Call State (Lifted to Dashboard)

  // Search State
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isChatSearching, setIsChatSearching] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState('')

  // Upload/Emoji State
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojis = ['👍', '❤️', '😂', '🔥', '✅', '👀', '✨', '🙌']

  // Reply State
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null)

  // Image Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Mobile List State
  const [isMobileListVisible, setIsMobileListVisible] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileListVisible(true)
    }
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      user.id = parseInt(user.id, 10)
      setCurrentUser(user)
    }
  }, [])

  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: () => getConversations(currentUser!.id),
    enabled: !!currentUser?.id,
  })

  useEffect(() => {
    if (conversations.length > 0 && !activeThreadId && !searchQuery) {
      setActiveThreadId(conversations[0].id)
    }
  }, [conversations, activeThreadId, searchQuery])

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeThreadId],
    queryFn: () => getMessages(activeThreadId!),
    enabled: !!activeThreadId,
  })

  // Debounced Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      if (currentUser?.id) {
        setIsSearching(true)
        const results = await searchUsers(searchQuery, currentUser.id)
        setSearchResults(results)
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, currentUser])

  const handleStartChatWithUser = async (userId: number) => {
    if (!currentUser) return
    const thread = await getOrCreateThread(currentUser.id, userId)
    await refetchConversations()
    setActiveThreadId(thread.id)
    setSearchQuery('')
    setSearchResults([])
  }

  // Realtime Pusher subscription
  useEffect(() => {
    if (!activeThreadId || !currentUser) return

    const channelName = `private-thread-${activeThreadId}`
    const channel = pusherClient.subscribe(channelName)

    channel.bind('message:created', (newMessage: any) => {
      queryClient.setQueryData(['messages', activeThreadId], (oldData: any) => {
        if (!oldData) return [newMessage]
        if (oldData.find((m: any) => m.id === newMessage.id)) return oldData
        return [...oldData, newMessage]
      })
      setTimeout(() => scrollToBottom(), 100)
      
      // If the message is from someone else and we are viewing the thread, mark it as read immediately
      if (newMessage.sender_id !== currentUser.id) {
        markThreadAsRead(activeThreadId).then(() => {
          refetchConversations()
        })
      }
    })

    // Call notification is now handled globally in northstar-dashboard.tsx

    channel.bind('typing', (data: any) => {
      if (data.senderId !== currentUser.id) {
        setIsTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
        scrollToBottom()
      }
    })

    channel.bind('thread:read', (data: any) => {
      queryClient.setQueryData(['messages', activeThreadId], (oldData: any) => {
        if (!oldData) return oldData
        return oldData.map((m: any) => {
          if (data.readerId !== currentUser.id && m.sender_id === currentUser.id) {
            return { ...m, is_read: true }
          }
          if (data.readerId === currentUser.id && m.sender_id !== currentUser.id) {
            return { ...m, is_read: true }
          }
          return m
        })
      })
      refetchConversations()
    })

    // When we open this thread, mark it as read
    markThreadAsRead(activeThreadId).then(() => {
      refetchConversations()
    })

    return () => {
      channel.unbind('message:created')
      channel.unbind('call:incoming')
      channel.unbind('typing')
      channel.unbind('thread:read')
      pusherClient.unsubscribe(channelName)
    }
  }, [activeThreadId, currentUser, queryClient, conversations])

  // Pusher Presence Subscription
  useEffect(() => {
    if (!currentUser) return

    const presenceChannel = pusherClient.subscribe('presence-chat')

    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      const ids = new Set<number>()
      members.each((member: any) => ids.add(Number(member.id)))
      setOnlineUsers(ids)
    })

    presenceChannel.bind('pusher:member_added', (member: any) => {
      setOnlineUsers(prev => new Set(prev).add(Number(member.id)))
    })

    presenceChannel.bind('pusher:member_removed', (member: any) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(Number(member.id))
        return next
      })
    })

    return () => {
      // Don't unsubscribe, we want presence to be maintained globally
      presenceChannel.unbind_all()
    }
  }, [currentUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessageMutation = useMutation({
    mutationFn: (data: { text: string, attachmentUrl?: string, replyToId?: number }) => 
      sendMessage(activeThreadId!, currentUser!.id, data.text, data.attachmentUrl, data.replyToId),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['messages', activeThreadId], (oldData: any) => {
        if (!oldData) return [newMessage]
        if (oldData.find((m: any) => m.id === newMessage.id)) return oldData
        return [...oldData, newMessage]
      })
      scrollToBottom()
    }
  })

  async function handleSendMessage() {
    const value = message.trim()
    if ((!value && !selectedFile) || !activeThreadId || !currentUser || isUploading) return

    let uploadedUrl: string | undefined = undefined

    if (selectedFile) {
      setIsUploading(true)
      toast.loading("Uploading file...", { id: "upload-toast" })
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('userId', currentUser.id.toString())
        
        const res = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        
        if (data.success) {
          toast.success("File uploaded successfully", { id: "upload-toast" })
          uploadedUrl = data.url
        } else {
          toast.error(data.error || "Upload failed", { id: "upload-toast" })
          setIsUploading(false)
          return
        }
      } catch (err) {
        toast.error("Network error during upload", { id: "upload-toast" })
        setIsUploading(false)
        return
      }
    }

    sendMessageMutation.mutate({ 
      text: value || (selectedFile ? `Sent an attachment: ${selectedFile.name}` : ''), 
      attachmentUrl: uploadedUrl,
      replyToId: replyingToMessage?.id
    })
    
    setMessage('')
    setSelectedFile(null)
    setReplyingToMessage(null)
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startCall = async (type: 'voice' | 'video') => {
    if (!activeThreadId || !currentUser) return
    if (onStartCall) {
      onStartCall(activeThreadId, type)
    }
  }

  const activeConversation = conversations.find(c => c.id === activeThreadId)

  const getAvatarColor = (id: number) => {
    const colors = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-muted', 'bg-destructive']
    return colors[id % colors.length]
  }

  if (!currentUser) return <div className="p-10 text-center">Loading user session...</div>

  return (
    <div className="flex flex-col gap-7 relative h-full">

      {/* Image Modal Overlay */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-full max-w-4xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-14 right-0 flex gap-4">
              <a href={selectedImage} download className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors" title="Download">
                <Download className="size-5" />
              </a>
              <button onClick={() => setSelectedImage(null)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors" title="Close">
                <X className="size-5" />
              </button>
            </div>
            <img src={selectedImage} alt="Fullscreen Attachment" className="max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageCircle className="size-4 text-primary" />Apps / Chat
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Team chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">Keep conversations, decisions, and handoffs in one focused workspace.</p>
      </div>
      
      <div className="flex flex-col lg:grid h-[640px] min-h-0 overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[280px_minmax(0,1fr)_230px] relative">
        {/* SIDEBAR */}
        <aside className={`flex flex-col border-b border-border lg:border-b-0 lg:border-r min-h-0 bg-card transition-all ${isMobileListVisible ? 'absolute inset-0 z-30' : 'hidden lg:flex'} lg:static lg:z-auto`}>
          <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
            <div>
              <p className="font-semibold">Messages</p>
              <p className="mt-1 text-xs text-muted-foreground">{conversations.length} conversations</p>
            </div>
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="More messages">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
          <div className="border-b border-border p-3 shrink-0">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input 
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs outline-none" 
                placeholder="Search or start new chat" 
                aria-label="Search conversations" 
              />
            </div>
          </div>
          <div className="flex flex-col p-2 overflow-auto flex-1">
            {searchQuery.length >= 2 ? (
              <div className="space-y-1">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Global Search</p>
                {isSearching ? (
                  <p className="p-3 text-xs text-muted-foreground text-center animate-pulse">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button 
                      key={user.id} 
                      onClick={() => { handleStartChatWithUser(user.id); setIsMobileListVisible(false); }}
                      className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
                    >
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground ${getAvatarColor(user.id)}`}>
                        {user.firstname[0]}{user.lastname[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="truncate text-sm font-medium">{user.firstname} {user.lastname}</span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><UserPlus className="size-3" /> Start chat</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-xs text-muted-foreground text-center">No users found</p>
                )}
              </div>
            ) : (
              conversations.map((item) => {
                const isOnline = onlineUsers.has(item.otherUserId)
                return (
                  <button 
                    key={item.id} 
                    onClick={() => { setActiveThreadId(item.id); setIsMobileListVisible(false); }} 
                    className={`flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${activeThreadId === item.id ? 'bg-accent' : 'hover:bg-muted'}`}
                  >
                    <div className="relative">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground ${getAvatarColor(item.otherUserId)}`}>
                        {item.initials}
                      </span>
                      {isOnline && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />}
                    </div>
                    <span className="min-w-0 flex-1">
                      <div className="flex w-full items-center justify-between">
                        <span className="font-semibold text-sm">{item.name}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {item.time ? new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                          {item.unreadCount > 0 && (
                            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{item.preview}</span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* MAIN CHAT */}
        <section className="flex min-h-0 min-w-0 flex-col relative">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-5 relative">
            <div className="flex items-center gap-3 w-full">
              {isChatSearching ? (
                <div className="flex items-center gap-2 w-full bg-background rounded-full px-4 py-2 border border-border">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Search in conversation..."
                    value={chatSearchQuery}
                    onChange={e => setChatSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                  />
                  <button onClick={() => {
                    setIsChatSearching(false)
                    setChatSearchQuery('')
                  }} className="text-muted-foreground hover:text-foreground p-1 shrink-0">
                    ✕
                  </button>
                </div>
              ) : activeConversation ? (
                <>
                  <button onClick={() => setIsMobileListVisible(true)} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-lg">
                    <ChevronLeft className="size-5" />
                  </button>
                  <div className="relative">
                    <span className={`flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground ${getAvatarColor(activeConversation.otherUserId)}`}>
                      {activeConversation.initials}
                    </span>
                    {onlineUsers.has(activeConversation.otherUserId) && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{activeConversation.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {onlineUsers.has(activeConversation.otherUserId) ? (
                        <><span className="size-1.5 rounded-full bg-green-500" />Online</>
                      ) : (
                        <><span className="size-1.5 rounded-full bg-muted-foreground" />Offline</>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-9 flex items-center">
                  <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
                </div>
              )}
            </div>

            {!isChatSearching && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startCall('voice')} disabled={!activeConversation} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50" aria-label="Start call">
                  <Phone className="size-4" />
                </button>
                <button onClick={() => startCall('video')} disabled={!activeConversation} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50" aria-label="Start video call">
                  <Video className="size-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50" disabled={!activeConversation} aria-label="More conversation options">
                    <MoreHorizontal className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => toast("Opening user profile...")}>View Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success("Notifications muted for this conversation.")}>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsChatSearching(true)}>
                      <Search className="mr-2 size-4" />
                      <span>Search Messages</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toast.error("Cannot delete conversation in demo mode.")} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </header>
          
          <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
            {(chatSearchQuery ? messages.filter((m: any) => m.message_content?.toLowerCase().includes(chatSearchQuery.toLowerCase())) : messages).map((item: any, index: number) => {
              const isOwn = item.sender_id === currentUser.id
              const time = new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              const initials = item.sender ? `${item.sender.firstname[0]}${item.sender.lastname[0]}` : '?'
              
              if (item.is_call) {
                return (
                  <div key={`call-${item.id || index}`} className="flex justify-center my-4">
                    <div className="bg-muted px-4 py-2 rounded-full text-xs text-muted-foreground flex items-center gap-2">
                      {item.type === 'video' ? <Video className="size-3" /> : <Phone className="size-3" />}
                      <span>{item.type === 'video' ? 'Video' : 'Voice'} Call</span>
                      <span className="font-medium">•</span>
                      <span>{item.duration ? `${Math.floor(item.duration / 60)}m ${item.duration % 60}s` : item.status}</span>
                      <span className="font-medium">•</span>
                      <span>{time}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div 
                  key={`msg-${item.id || index}`} 
                  className={`flex gap-3 relative group ${isOwn ? 'flex-row-reverse' : ''} transition-transform duration-200`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${isOwn ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                    {initials}
                  </span>
                  <div className={`flex max-w-[78%] flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-6 relative ${isOwn ? 'rounded-tr-sm bg-primary text-primary-foreground' : 'rounded-tl-sm bg-muted'}`}>
                      {item.reply_to && (
                        <div className={`mb-2 rounded-lg p-2 text-xs border-l-2 ${isOwn ? 'bg-black/10 border-white/50 text-white' : 'bg-background border-primary text-foreground'}`}>
                          <p className="font-semibold">{item.reply_to.sender?.firstname} {item.reply_to.sender?.lastname}</p>
                          <p className="line-clamp-2 truncate opacity-80">{item.reply_to.message_content}</p>
                        </div>
                      )}
                      {item.message_content}
                      {item.attachment && (
                        <div className="mt-2 overflow-hidden rounded-xl bg-background/10">
                          {decodeURIComponent(item.attachment).includes('type=image') ? (
                            <img 
                              src={item.attachment} 
                              alt="Attachment" 
                              className="max-w-[200px] h-auto rounded-xl border border-border/20 cursor-pointer hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(item.attachment);
                              }}
                            />
                          ) : (
                            <a 
                              href={item.attachment} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-2 p-2 hover:bg-background/20 rounded-xl transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // 1. Trigger Download
                                const downloadLink = document.createElement('a');
                                downloadLink.href = item.attachment;
                                downloadLink.download = new URLSearchParams(item.attachment.split('?')[1]).get('name') || 'download';
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                                
                                // 2. Open in New Tab for viewing
                                window.open(`/api/chat/view?file=${encodeURIComponent(item.attachment.split('?')[0])}`, '_blank');
                              }}
                            >
                              <Paperclip className="size-4 shrink-0" />
                              <span className="truncate max-w-[150px] text-xs font-medium underline-offset-4 hover:underline">
                                {new URLSearchParams(item.attachment.split('?')[1]).get('name') || 'Download File'}
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 px-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-muted-foreground">{time}</span>
                      {isOwn && (
                        <span className="flex items-center">
                          {item.is_read ? <CheckCheck className="size-3 text-blue-500" /> : <Check className="size-3 text-muted-foreground/60" />}
                        </span>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingToMessage(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mx-1"
                        aria-label="Reply to message"
                      >
                        <Reply className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* TYPING INDICATOR */}
            {isTyping && (
              <div className="flex items-center gap-2 px-5 py-2 text-xs italic text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="size-1.5 animate-bounce rounded-full bg-primary/60"></div>
                  <div className="size-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '0.2s' }}></div>
                  <div className="size-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          <div className="shrink-0 border-t border-border p-4 relative">
            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 bg-card border border-border shadow-lg rounded-xl p-2 grid grid-cols-4 gap-2 z-10 animate-in fade-in slide-in-from-bottom-2">
                {emojis.map(e => (
                  <button 
                    key={e} 
                    onClick={() => {
                      setMessage(prev => prev + e)
                      setShowEmojiPicker(false)
                    }}
                    className="size-8 flex items-center justify-center hover:bg-muted rounded-lg text-lg"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {(selectedFile || replyingToMessage) && (
              <div className="mb-2 p-3 bg-muted rounded-xl flex flex-col gap-2 relative text-sm">
                {replyingToMessage && (
                  <div className="flex justify-between items-center bg-background rounded-lg p-2 border-l-2 border-primary">
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-primary">Replying to {replyingToMessage.sender?.firstname}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{replyingToMessage.message_content}</p>
                    </div>
                    <button onClick={() => setReplyingToMessage(null)} className="text-muted-foreground hover:text-foreground p-1 shrink-0">✕</button>
                  </div>
                )}
                {selectedFile && (
                  <div className="flex justify-between items-center bg-background rounded-lg p-2 border">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      <p className="text-xs font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                    </div>
                    <button onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }} className="text-muted-foreground hover:text-foreground p-1 shrink-0">✕</button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.length) {
                    setSelectedFile(e.target.files[0])
                  }
                }} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted" 
                aria-label="Attach file"
              >
                <Paperclip className="size-4" />
              </button>
              <textarea 
                rows={1} 
                value={message} 
                onChange={(e) => {
                  setMessage(e.target.value)
                  if (activeThreadId) {
                    const now = Date.now()
                    if (now - lastTypingTime.current > 2000) {
                      lastTypingTime.current = now
                      triggerTyping(activeThreadId)
                    }
                  }
                }} 
                onKeyDown={(event) => { 
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { 
                    event.preventDefault(); 
                    handleSendMessage() 
                  } 
                }} 
                placeholder={isUploading ? "Uploading..." : "Write a message..."} 
                disabled={isUploading}
                className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none disabled:opacity-50" 
                aria-label="Write a message" 
              />
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors ${showEmojiPicker ? 'bg-muted' : ''}`} 
                aria-label="Add emoji"
              >
                <Smile className="size-4" />
              </button>
              <button 
                onClick={handleSendMessage} 
                disabled={sendMessageMutation.isPending || !activeConversation}
                className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" 
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-muted-foreground">Press Enter to send · Shift + Enter for a new line</p>
          </div>
        </section>

        {/* DETAILS PANEL */}
        <aside className="hidden border-l border-border bg-muted/20 lg:block min-h-0 overflow-auto">
          {activeConversation ? (
            <>
              <div className="border-b border-border p-5 text-center">
                <div className="relative mx-auto w-max">
                  <span className={`flex size-16 items-center justify-center rounded-full text-lg font-semibold text-primary-foreground ${getAvatarColor(activeConversation.otherUserId)}`}>
                    {activeConversation.initials}
                  </span>
                  {onlineUsers.has(activeConversation.otherUserId) && <span className="absolute bottom-1 right-1 size-3.5 rounded-full border-[3px] border-background bg-green-500" />}
                </div>
                <p className="mt-3 font-semibold">{activeConversation.name}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] text-accent-foreground">
                  {onlineUsers.has(activeConversation.otherUserId) ? (
                    <><span className="size-1.5 rounded-full bg-green-500" />Online</>
                  ) : (
                    <><span className="size-1.5 rounded-full bg-muted-foreground" />Offline</>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Shared files</p>
                  <p className="mt-3 text-sm">No files yet.</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Details</p>
                  <p className="mt-3 text-xs text-muted-foreground">User ID: {activeConversation.otherUserId}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No details to show</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
