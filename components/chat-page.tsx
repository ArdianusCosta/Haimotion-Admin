'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, MoreHorizontal, Paperclip, Phone, Search, Send, Smile, Video, UserPlus, Reply, Download, X, Check, CheckCheck, ChevronLeft, User, Mail, FileText, ExternalLink, Copy, Shield, UserCheck, UserX, PanelRight, Users, Plus, Settings } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cleanUserName } from '@/lib/utils'
import {
  getConversations,
  getMessages,
  sendMessage,
  createCallSession,
  searchUsers,
  getOrCreateThread,
  triggerTyping,
  markThreadAsRead,
  getGroupMessages,
  sendGroupMessage,
  markGroupAsRead,
  triggerGroupTyping
} from '@/app/actions/chat'
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
import { UserProfileSheet } from '@/components/chat/user-profile-sheet'
import { CreateGroupDialog } from '@/components/chat/create-group-dialog'
import { GroupSettingsSheet } from '@/components/chat/group-settings-sheet'

export function ChatPage({ onStartCall }: { onStartCall?: (threadId: number, type: 'voice' | 'video') => void }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [activeChatKey, setActiveChatKey] = useState<string | null>(null)
  const [chatFilter, setChatFilter] = useState<'all' | 'direct' | 'group'>('all')
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true)
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const [typingUserName, setTypingUserName] = useState('')
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

  const { data: conversations = [], isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: () => getConversations(currentUser!.id),
    enabled: !!currentUser?.id,
  })

  const activeConversation = conversations.find((c: any) => c.key === activeChatKey || c.id === activeThreadId) || (conversations.length > 0 ? conversations[0] : null)

  useEffect(() => {
    if (conversations.length > 0 && !activeChatKey && !searchQuery) {
      setActiveChatKey(conversations[0].key)
      setActiveThreadId(conversations[0].id)
    }
  }, [conversations, activeChatKey, searchQuery])

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<any[]>({
    queryKey: ['messages', activeConversation?.key],
    queryFn: async (): Promise<any[]> => {
      if (!activeConversation) return []
      if (activeConversation.type === 'group') {
        return await getGroupMessages(activeConversation.id)
      }
      return await getMessages(activeConversation.id)
    },
    enabled: !!activeConversation,
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
    setActiveChatKey(`thread-${thread.id}`)
    setActiveThreadId(thread.id)
    setSearchQuery('')
    setSearchResults([])
  }

  // Realtime Pusher subscription
  useEffect(() => {
    if (!activeConversation || !currentUser) return

    const channelName = activeConversation.type === 'group'
      ? `private-group-${activeConversation.id}`
      : `private-thread-${activeConversation.id}`
    const channel = pusherClient.subscribe(channelName)

    channel.bind('message:created', (newMessage: any) => {
      queryClient.setQueryData(['messages', activeConversation.key], (oldData: any) => {
        if (!oldData) return [newMessage]
        if (oldData.find((m: any) => m.id === newMessage.id)) return oldData
        return [...oldData, newMessage]
      })
      setTimeout(() => scrollToBottom(), 100)
      
      // If the message is from someone else, mark as read
      if (newMessage.sender_id !== currentUser.id) {
        if (activeConversation.type === 'group') {
          markGroupAsRead(activeConversation.id).then(() => {
            refetchConversations()
          })
        } else {
          markThreadAsRead(activeConversation.id).then(() => {
            refetchConversations()
          })
        }
      }
    })

    channel.bind('typing', (data: any) => {
      if (data.senderId !== currentUser.id) {
        setIsTyping(true)
        setTypingUserName(data.senderName || '')
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setTypingUserName('')
        }, 3000)
        scrollToBottom()
      }
    })

    if (activeConversation.type === 'thread') {
      channel.bind('thread:read', (data: any) => {
        queryClient.setQueryData(['messages', activeConversation.key], (oldData: any) => {
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

      markThreadAsRead(activeConversation.id).then(() => {
        refetchConversations()
      })
    } else {
      markGroupAsRead(activeConversation.id).then(() => {
        refetchConversations()
      })
    }

    return () => {
      channel.unbind('message:created')
      channel.unbind('call:incoming')
      channel.unbind('typing')
      channel.unbind('thread:read')
      pusherClient.unsubscribe(channelName)
    }
  }, [activeConversation?.key, currentUser, queryClient])

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

  const sendMessageMutation = useMutation<any, Error, { text: string, attachmentUrl?: string, replyToId?: number }>({
    mutationFn: async (data: { text: string, attachmentUrl?: string, replyToId?: number }) => {
      if (!activeConversation) throw new Error("No active conversation")
      if (activeConversation.type === 'group') {
        return await sendGroupMessage(activeConversation.id, currentUser!.id, data.text, data.attachmentUrl)
      }
      return await sendMessage(activeConversation.id, currentUser!.id, data.text, data.attachmentUrl, data.replyToId)
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['messages', activeConversation?.key], (oldData: any) => {
        if (!oldData) return [newMessage]
        if (oldData.find((m: any) => m.id === newMessage.id)) return oldData
        return [...oldData, newMessage]
      })
      refetchConversations()
      scrollToBottom()
    }
  })

  async function handleSendMessage() {
    const value = message.trim()
    if ((!value && !selectedFile) || !activeConversation || !currentUser || isUploading) return

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
    if (!activeConversation || activeConversation.type !== 'thread' || !currentUser) return
    if (onStartCall) {
      onStartCall(activeConversation.id, type)
    }
  }

  const getAvatarColor = (id?: number) => {
    if (!id) return 'bg-primary'
    const colors = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-muted', 'bg-destructive']
    return colors[id % colors.length]
  }

  const filteredConversations = conversations.filter((c: any) => {
    if (chatFilter === 'direct') return c.type === 'thread'
    if (chatFilter === 'group') return c.type === 'group'
    return true
  })

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
      
      <div className={`flex flex-col lg:grid h-[640px] min-h-0 overflow-hidden rounded-2xl border border-border bg-card relative ${
        isDetailsPanelOpen 
          ? 'lg:grid-cols-[290px_minmax(0,1fr)_300px]' 
          : 'lg:grid-cols-[290px_minmax(0,1fr)]'
      }`}>
        {/* SIDEBAR */}
        <aside className={`flex flex-col border-b border-border lg:border-b-0 lg:border-r min-h-0 bg-card transition-all ${isMobileListVisible ? 'absolute inset-0 z-30' : 'hidden lg:flex'} lg:static lg:z-auto`}>
          <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
            <div>
              <p className="font-semibold text-foreground">Messages</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{conversations.length} conversations</p>
            </div>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-xs font-semibold shadow-xs"
              title="Buat Grup Baru"
            >
              <Plus className="size-3.5" />
              <span>Grup</span>
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
                placeholder="Cari user atau percakapan..." 
                aria-label="Search conversations" 
              />
            </div>
          </div>

          {/* Filter Tabs: Semua / Pribadi / Grup */}
          <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/20 shrink-0">
            {(['all', 'direct', 'group'] as const).map(tab => {
              const label = tab === 'all' ? 'Semua' : tab === 'direct' ? 'Pribadi' : 'Grup'
              const count = tab === 'all' 
                ? conversations.length 
                : tab === 'direct' 
                  ? conversations.filter((c: any) => c.type === 'thread').length 
                  : conversations.filter((c: any) => c.type === 'group').length
              const isActive = chatFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setChatFilter(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
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
            ) : isLoadingConversations ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3 animate-in fade-in duration-500">
                    <Skeleton className="size-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Tidak ada percakapan ditemukan
              </div>
            ) : (
              filteredConversations.map((item: any) => {
                const isSelected = activeConversation?.key === item.key
                const isGroup = item.type === 'group'
                const isOnline = !isGroup && onlineUsers.has(item.otherUserId)

                return (
                  <button 
                    key={item.key} 
                    onClick={() => { 
                      setActiveChatKey(item.key); 
                      setActiveThreadId(item.type === 'thread' ? item.id : null); 
                      setIsMobileListVisible(false); 
                    }} 
                    className={`flex items-start gap-3 rounded-xl p-3 text-left transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-muted'}`}
                  >
                    <div className="relative shrink-0">
                      {isGroup ? (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-500/20 via-orange-500/20 to-purple-500/20 text-primary border border-primary/20 shadow-xs">
                          <Users className="size-4.5 text-primary" />
                        </span>
                      ) : (
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground ${getAvatarColor(item.otherUserId)}`}>
                          {item.initials}
                        </span>
                      )}
                      {isOnline && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />}
                    </div>
                    <span className="min-w-0 flex-1">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-sm truncate">{cleanUserName(item.name)}</span>
                          {isGroup && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/5 shrink-0">
                              Grup
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
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
                  {activeConversation.type === 'group' ? (
                    <div 
                      onClick={() => setIsDetailsPanelOpen(true)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                      title="Lihat detail grup"
                    >
                      <div className="relative">
                        <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-amber-500/20 via-orange-500/20 to-purple-500/20 text-primary border border-primary/20 shadow-xs">
                          <Users className="size-5 text-primary" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold hover:underline">{activeConversation.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/5">
                            Grup
                          </Badge>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3 text-muted-foreground" />
                          <span>{activeConversation.memberCount || activeConversation.members?.length || 0} anggota</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsProfileSheetOpen(true)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                      title="Click to view profile"
                    >
                      <div className="relative">
                        <span className={`flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground ${getAvatarColor(activeConversation.otherUserId)}`}>
                          {activeConversation.initials}
                        </span>
                        {onlineUsers.has(activeConversation.otherUserId) && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold hover:underline">{activeConversation.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {onlineUsers.has(activeConversation.otherUserId) ? (
                            <><span className="size-1.5 rounded-full bg-green-500" />Online</>
                          ) : (
                            <><span className="size-1.5 rounded-full bg-muted-foreground" />Offline</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-9 flex items-center">
                  <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
                </div>
              )}
            </div>

            {!isChatSearching && (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => startCall('voice')} 
                  disabled={!activeConversation || activeConversation.type === 'group'} 
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" 
                  title={activeConversation?.type === 'group' ? "Voice call tidak didukung di grup" : "Start call"}
                  aria-label="Start call"
                >
                  <Phone className="size-4" />
                </button>
                <button 
                  onClick={() => startCall('video')} 
                  disabled={!activeConversation || activeConversation.type === 'group'} 
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed" 
                  title={activeConversation?.type === 'group' ? "Video call tidak didukung di grup" : "Start video call"}
                  aria-label="Start video call"
                >
                  <Video className="size-4" />
                </button>
                <button
                  onClick={() => setIsDetailsPanelOpen(prev => !prev)}
                  disabled={!activeConversation}
                  className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${isDetailsPanelOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                  title={isDetailsPanelOpen ? "Sembunyikan panel detail" : "Tampilkan panel detail"}
                  aria-label="Toggle details panel"
                >
                  <PanelRight className="size-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50" disabled={!activeConversation} aria-label="More conversation options">
                    <MoreHorizontal className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {activeConversation?.type === 'group' ? (
                      <>
                        <DropdownMenuItem onClick={() => setIsDetailsPanelOpen(true)} className="cursor-pointer">
                          <Users className="mr-2 size-4" />
                          <span>Detail & Anggota Grup</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsChatSearching(true)} className="cursor-pointer">
                          <Search className="mr-2 size-4" />
                          <span>Cari Pesan</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Notifikasi grup dimatikan.")} className="cursor-pointer">
                          Matikan Notifikasi
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => setIsProfileSheetOpen(true)} className="cursor-pointer">
                          <User className="mr-2 size-4" />
                          <span>View Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Notifications muted for this conversation.")}>
                          Mute Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsChatSearching(true)} className="cursor-pointer">
                          <Search className="mr-2 size-4" />
                          <span>Search Messages</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </header>
          
          <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
            {isLoadingMessages ? (
              <div className="flex flex-col gap-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex items-end gap-2 animate-in fade-in duration-500 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <Skeleton className="size-8 rounded-full shrink-0" />
                    <div className={`space-y-1 ${i % 2 === 0 ? 'items-start' : 'items-end'} flex flex-col`}>
                      <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (chatSearchQuery ? messages.filter((m: any) => m.message_content?.toLowerCase().includes(chatSearchQuery.toLowerCase())) : messages).map((item: any, index: number) => {
              const isOwn = item.sender_id === currentUser.id
              const time = new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              const senderDisplayName = item.sender ? (item.sender.name || `${cleanUserName(item.sender.firstname)} ${cleanUserName(item.sender.lastname)}`.trim()) : 'User'
              const senderInitials = item.sender?.name 
                ? item.sender.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
                : (item.sender?.firstname ? `${item.sender.firstname[0]}${item.sender.lastname?.[0] || ''}` : '?')
              const isGroup = activeConversation?.type === 'group'
              
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
                    {senderInitials}
                  </span>
                  <div className={`flex max-w-[78%] flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* For Group messages, display sender name and role if not own message */}
                    {!isOwn && isGroup && (
                      <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-primary">
                        <span>{senderDisplayName}</span>
                        {item.sender?.role && (
                          <span className="text-[10px] text-muted-foreground font-normal">· {item.sender.role}</span>
                        )}
                      </div>
                    )}
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
                <span>{typingUserName ? `${typingUserName} sedang mengetik...` : 'sedang mengetik...'}</span>
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
                      <p className="text-xs font-semibold text-primary">Replying to {replyingToMessage.sender?.firstname || replyingToMessage.sender?.name}</p>
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
                  if (activeConversation) {
                    const now = Date.now()
                    if (now - lastTypingTime.current > 2000) {
                      lastTypingTime.current = now
                      if (activeConversation.type === 'group') {
                        triggerGroupTyping(activeConversation.id, `${currentUser.firstname} ${currentUser.lastname}`)
                      } else {
                        triggerTyping(activeConversation.id)
                      }
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
        {isDetailsPanelOpen && (
          <aside className="hidden border-l border-border bg-muted/20 lg:flex flex-col min-h-0 overflow-y-auto overflow-x-hidden w-full">
            {activeConversation ? (() => {
              const threadAttachments = messages.filter((m: any) => !!m.attachment)

              if (activeConversation.type === 'group') {
                return (
                  <>
                    {/* Top Bar with Title and Close Button */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5 shrink-0 bg-muted/30">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Detail Grup</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsGroupSettingsOpen(true)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                          title="Pengaturan grup"
                          aria-label="Pengaturan grup"
                        >
                          <Settings className="size-3.5" />
                        </button>
                        <button 
                          onClick={() => setIsDetailsPanelOpen(false)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Tutup detail"
                          aria-label="Tutup detail"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="border-b border-border p-4 text-center">
                      <div className="relative mx-auto w-max">
                        <span className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-amber-500/20 via-orange-500/20 to-purple-500/20 text-primary border border-primary/20 shadow-sm">
                          <Users className="size-7 text-primary" />
                        </span>
                      </div>
                      <p className="mt-2.5 font-semibold text-sm text-foreground break-words leading-snug px-1">
                        {activeConversation.name}
                      </p>
                      
                      {activeConversation.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 px-2 italic line-clamp-3">
                          "{activeConversation.description}"
                        </p>
                      )}

                      {/* Badges */}
                      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 border-primary/30 bg-primary/10 text-primary">
                          Grup Chat
                        </Badge>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">
                          <Users className="size-3 text-primary" />
                          {activeConversation.members?.length || activeConversation.memberCount || 0} Anggota
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5 p-4">
                      {/* Members Section */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Anggota ({activeConversation.members?.length || 0})
                        </p>

                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {activeConversation.members?.map((member: any) => {
                            const isMe = member.id === currentUser.id
                            const isMemberOnline = onlineUsers.has(member.id)
                            return (
                              <div 
                                key={member.id} 
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50 border border-border/60 hover:bg-muted/60 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative shrink-0">
                                    <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground ${getAvatarColor(member.id)}`}>
                                      {member.name ? member.name[0]?.toUpperCase() : 'U'}
                                    </span>
                                    {isMemberOnline && (
                                      <span className="absolute bottom-0 right-0 size-2 rounded-full border-2 border-background bg-green-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate text-foreground flex items-center gap-1">
                                      <span>{cleanUserName(member.name)}</span>
                                      {isMe && <span className="text-[9px] text-muted-foreground">(Anda)</span>}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">{member.role || 'Member'}</p>
                                  </div>
                                </div>
                                {member.isAdmin && (
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Shared Files Section */}
                      <div className="border-t border-border pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Shared Files {threadAttachments.length > 0 && `(${threadAttachments.length})`}
                        </p>

                        {threadAttachments.length === 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">Belum ada file dibagikan</p>
                        ) : (
                          <div className="mt-2 space-y-1.5">
                            {threadAttachments.slice(-4).reverse().map((att: any) => {
                              const isImg = /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(att.attachment)
                              const fileName = att.attachment.split('/').pop() || 'Attachment'
                              return (
                                <a
                                  key={att.id}
                                  href={att.attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2 text-xs hover:bg-muted transition-colors group/item min-w-0"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {isImg ? (
                                      <img src={att.attachment} alt="thumb" className="size-6 rounded object-cover border border-border shrink-0" />
                                    ) : (
                                      <FileText className="size-4 text-primary shrink-0" />
                                    )}
                                    <span className="truncate text-[11px] font-medium text-foreground min-w-0">{fileName}</span>
                                  </div>
                                  <ExternalLink className="size-3 text-muted-foreground group-hover/item:text-foreground shrink-0" />
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )
              }

              // Direct Thread Details
              const isResigned = activeConversation.status === 'resign'

              return (
                <>
                  {/* Top Bar with Title and Close Button */}
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5 shrink-0 bg-muted/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User Details</span>
                    <button 
                      onClick={() => setIsDetailsPanelOpen(false)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Close details"
                      aria-label="Close details"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div 
                    onClick={() => setIsProfileSheetOpen(true)}
                    className="border-b border-border p-4 text-center cursor-pointer hover:bg-muted/40 transition-colors group"
                    title="Click to view full profile"
                  >
                    <div className="relative mx-auto w-max">
                      <span className={`flex size-14 items-center justify-center rounded-full text-base font-semibold text-primary-foreground ${getAvatarColor(activeConversation.otherUserId)} group-hover:scale-105 transition-transform`}>
                        {activeConversation.initials}
                      </span>
                      {onlineUsers.has(activeConversation.otherUserId) && (
                        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
                      )}
                    </div>
                    <p className="mt-2.5 font-semibold text-sm group-hover:text-primary transition-colors text-foreground break-words leading-snug px-1">
                      {cleanUserName(activeConversation.name)}
                    </p>
                    
                    {/* Role text */}
                    {activeConversation.role && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1.5 px-1">
                        <Shield className="size-3 text-primary shrink-0" />
                        <span className="truncate">{activeConversation.role}</span>
                      </p>
                    )}

                    {/* Status & Online badge */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium px-2 py-0.5 border ${
                          isResigned
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isResigned ? (
                          <span className="flex items-center gap-1">
                            <UserX className="size-2.5" />
                            Resign
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserCheck className="size-2.5" />
                            Active
                          </span>
                        )}
                      </Badge>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">
                        <span className={`size-1.5 rounded-full ${onlineUsers.has(activeConversation.otherUserId) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        {onlineUsers.has(activeConversation.otherUserId) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5 p-4">
                    <div>
                      <button 
                        onClick={() => setIsProfileSheetOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/50 transition-colors shadow-xs"
                      >
                        <User className="size-3.5 text-primary" />
                        View Full Profile
                      </button>
                    </div>

                    {/* Contact / Email Info */}
                    {activeConversation.email && (
                      <div className="border-t border-border pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Email</p>
                        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-background/50 border border-border p-2 min-w-0">
                          <span className="text-xs text-foreground truncate min-w-0 flex-1">{activeConversation.email}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeConversation.email)
                              toast.success("Email copied to clipboard")
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0 rounded hover:bg-muted"
                            title="Copy email"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Shared Files Section */}
                    <div className="border-t border-border pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Shared Files {threadAttachments.length > 0 && `(${threadAttachments.length})`}
                      </p>

                      {threadAttachments.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">No shared files yet</p>
                      ) : (
                        <div className="mt-2 space-y-1.5">
                          {threadAttachments.slice(-3).reverse().map((att: any) => {
                            const isImg = /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(att.attachment)
                            const fileName = att.attachment.split('/').pop() || 'Attachment'
                            return (
                              <a
                                key={att.id}
                                href={att.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2 text-xs hover:bg-muted transition-colors group/item min-w-0"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {isImg ? (
                                    <img src={att.attachment} alt="thumb" className="size-6 rounded object-cover border border-border shrink-0" />
                                  ) : (
                                    <FileText className="size-4 text-primary shrink-0" />
                                  )}
                                  <span className="truncate text-[11px] font-medium text-foreground min-w-0">{fileName}</span>
                                </div>
                                <ExternalLink className="size-3 text-muted-foreground group-hover/item:text-foreground shrink-0" />
                              </a>
                            )
                          })}
                          {threadAttachments.length > 3 && (
                            <button
                              onClick={() => setIsProfileSheetOpen(true)}
                              className="text-[11px] text-primary hover:underline font-medium w-full text-center mt-1"
                            >
                              View all {threadAttachments.length} files
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )
            })() : (
              <div className="h-full flex items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">No details to show</p>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Slide-over User Profile Sheet */}
      <UserProfileSheet
        open={isProfileSheetOpen}
        onOpenChange={setIsProfileSheetOpen}
        userId={activeConversation?.type === 'thread' ? activeConversation?.otherUserId : null}
        threadId={activeConversation?.type === 'thread' ? activeConversation?.id : null}
        isOnline={activeConversation?.type === 'thread' ? onlineUsers.has(activeConversation.otherUserId) : false}
        onStartCall={(type) => startCall(type)}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onGroupCreated={(newGroup) => {
          refetchConversations()
          setActiveChatKey(`group-${newGroup.id}`)
          setActiveThreadId(null)
        }}
      />

      {/* Group Settings Sheet */}
      {activeConversation?.type === 'group' && (
        <GroupSettingsSheet
          open={isGroupSettingsOpen}
          onOpenChange={setIsGroupSettingsOpen}
          groupId={activeConversation.groupId || activeConversation.id}
          groupName={activeConversation.name}
          groupDescription={activeConversation.description}
          members={activeConversation.members || []}
          currentUserId={currentUser?.id || 0}
          isCurrentUserAdmin={!!activeConversation.members?.find((m: any) => m.id === currentUser?.id)?.isAdmin}
          onGroupUpdated={(updates) => {
            queryClient.setQueryData(
              ['conversations', currentUser?.id],
              (old: any[]) =>
                (old || []).map((c: any) =>
                  c.key === activeConversation.key
                    ? {
                        ...c,
                        ...(updates.name !== undefined && { name: updates.name }),
                        ...(updates.description !== undefined && { description: updates.description }),
                        ...(updates.members !== undefined && {
                          members: updates.members,
                          memberCount: updates.members.length,
                        }),
                      }
                    : c
                )
            )
          }}
        />
      )}
    </div>
  )
}
