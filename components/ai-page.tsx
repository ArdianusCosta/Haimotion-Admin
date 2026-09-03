'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Sparkles, Bot, User, Paperclip, Send, Mic, MoreVertical, 
  Plus, MessageSquare, Edit3, Settings, Trash2, StopCircle, 
  TerminalSquare, Code, FileText, Image as ImageIcon,
  Copy, Check, Pin, PinOff, Edit2, AlertTriangle, Key, X, Download, Expand
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock Data
const chatHistory = [
  { id: 1, title: 'Fix React useEffect bug', date: 'Today' },
  { id: 2, title: 'Write marketing copy for Q4', date: 'Yesterday' },
  { id: 3, title: 'Analyze user feedback data', date: 'Previous 7 Days' },
  { id: 4, title: 'Generate logo concepts', date: 'Previous 30 Days' },
]

const suggestions = [
  { icon: Code, title: 'Help me debug', description: 'Find and fix errors in my React code' },
  { icon: FileText, title: 'Summarize text', description: 'Condense long articles into key points' },
  { icon: TerminalSquare, title: 'Write a script', description: 'Create a python script for data analysis' },
  { icon: ImageIcon, title: 'Image generation', description: 'Create visuals for a marketing campaign' },
]

function CodeBlock({ language, code }: { language: string, code: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="my-4 overflow-hidden rounded-xl bg-[#1e1e2e] border border-zinc-800/50 shadow-sm">
      <div className="flex items-center justify-between bg-[#11111b] px-4 py-2 text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">{language || 'code'}</span>
        <button 
          onClick={handleCopy} 
          className="hover:text-zinc-100 flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />} 
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-[13px] font-mono text-blue-100 leading-relaxed">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  )
}

function renderMarkdown(content: string, onImageClick?: (src: string) => void) {
  const blocks = [];
  let currentText = '';
  let inCodeBlock = false;
  let codeLanguage = '';
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', language: codeLanguage, content: currentText });
        currentText = '';
        inCodeBlock = false;
      } else {
        if (currentText) {
          blocks.push({ type: 'text', content: currentText });
        }
        currentText = '';
        codeLanguage = line.slice(3).trim();
        inCodeBlock = true;
      }
    } else {
      currentText += line + '\n';
    }
  }
  if (currentText) {
    blocks.push({ type: inCodeBlock ? 'code' : 'text', language: codeLanguage, content: currentText });
  }

  return blocks.map((block, idx) => {
    if (block.type === 'code') {
      return <CodeBlock key={idx} language={block.language} code={block.content.trim()} />
    }

    return (
      <div key={idx} className="flex flex-col">
        {block.content.split('\n').map((line, lineIdx) => {
          if (!line.trim()) return <div key={lineIdx} className="h-2" />
          
          let isList = false
          let parsedContent = line
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            isList = true
            parsedContent = line.trim().substring(2)
          }

          const imageMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imageMatch) {
            return (
              <div 
                key={lineIdx} 
                className="group relative my-3 overflow-hidden rounded-xl border border-border cursor-pointer shadow-sm transition-all hover:shadow-md"
                onClick={() => onImageClick?.(imageMatch[2])}
              >
                <img src={imageMatch[2]} alt={imageMatch[1]} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white bg-black/60 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                    <Expand className="size-4" />
                    View Image
                  </span>
                </div>
              </div>
            )
          }

          const isH3 = parsedContent.startsWith('### ')
          const isH2 = parsedContent.startsWith('## ')
          const isH1 = parsedContent.startsWith('# ')
          if (isH3) parsedContent = parsedContent.substring(4)
          else if (isH2) parsedContent = parsedContent.substring(3)
          else if (isH1) parsedContent = parsedContent.substring(2)

          const parts = parsedContent.split(/(\*\*.*?\*\*|\*.*?\*)/g)
          
          const formattedLine = parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={j}>{part.slice(1, -1)}</em>
            }
            return part
          })

          if (isH1) return <h1 key={lineIdx} className="mt-4 mb-2 text-xl font-bold">{formattedLine}</h1>
          if (isH2) return <h2 key={lineIdx} className="mt-3 mb-2 text-lg font-bold">{formattedLine}</h2>
          if (isH3) return <h3 key={lineIdx} className="mt-2 mb-1 text-base font-bold">{formattedLine}</h3>
          
          if (isList) return <li key={lineIdx} className="ml-4 list-disc mb-1 leading-relaxed">{formattedLine}</li>
          
          return <p key={lineIdx} className="mb-2 last:mb-0 leading-relaxed">{formattedLine}</p>
        })}
      </div>
    )
  })
}

function useChat() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)
  const [customApiKey, setCustomApiKey] = useState('')
  
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const queryClient = useQueryClient();

  useEffect(() => {
    const dataStr = localStorage.getItem('auth_user')
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr)
        setAdminData(data)
      } catch (e) {}
    }
    const savedKey = localStorage.getItem('custom_gemini_api_key')
    if (savedKey) {
      setCustomApiKey(savedKey)
    }
  }, [])

  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads', adminData?.id],
    queryFn: async () => {
      if (!adminData?.id) return [];
      const res = await fetch(`/api/chat/threads?userId=${adminData.id}`);
      const json = await res.json();
      return json.threads || [];
    },
    enabled: !!adminData?.id
  });

  const loadThread = (threadId: string) => {
    if (isLoading) return;
    setActiveThreadId(threadId)
    setMessages([])
    if (adminData) {
      fetch(`/api/chat?userId=${adminData.id}&threadId=${threadId}`)
        .then(res => res.json())
        .then(res => {
          if (res.messages) setMessages(res.messages)
        })
    }
  }

  const createNewChat = () => {
    if (isLoading) return;
    setActiveThreadId(null)
    setMessages([])
  }

  const updateThreadMutation = useMutation({
    mutationFn: async ({ threadId, updates }: { threadId: string, updates: any }) => {
      return fetch(`/api/chat/threads/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads', adminData?.id] });
    }
  });

  const updateThread = (threadId: string, updates: { title?: string, is_pinned?: boolean }) => {
    updateThreadMutation.mutate({ threadId, updates });
  }

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      return fetch(`/api/chat/threads/${threadId}`, { method: 'DELETE' }).then(r => r.json());
    },
    onSuccess: (_, deletedThreadId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-threads', adminData?.id] });
      if (activeThreadId === deletedThreadId) {
        createNewChat();
      }
    }
  });

  const deleteThread = (threadId: string) => deleteThreadMutation.mutate(threadId);

  const handleInputChange = (e: any) => setInput(e.target.value)

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e?: any, overrideInput?: string) => {
    if (e) e.preventDefault()
    const textToSend = overrideInput !== undefined ? overrideInput : input;
    if (!textToSend.trim()) return

    const userMessage = { role: 'user' as const, content: textToSend }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    let currentThreadId = activeThreadId;

    if (!currentThreadId && adminData) {
      const title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '')
      try {
        const res = await fetch('/api/chat/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: adminData.id, title })
        }).then(r => r.json())
        
        if (res.thread) {
          currentThreadId = res.thread.id
          setActiveThreadId(currentThreadId)
          queryClient.invalidateQueries({ queryKey: ['chat-threads', adminData.id] });
        }
      } catch(e) { console.error(e) }
    }

    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          identity: adminData,
          threadId: currentThreadId,
          customApiKey: customApiKey
        }),
        signal: abortControllerRef.current.signal
      })

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Chat API Error Response:', errorText);
        throw new Error(`Failed to fetch: ${res.status} ${errorText}`);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let buffer = ''
      let fullAiResponse = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') continue
            try {
              const data = JSON.parse(dataStr)
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
              if (text) {
                fullAiResponse += text
                setMessages(prev => {
                  const last = prev[prev.length - 1]
                  return [...prev.slice(0, -1), { ...last, content: last.content + text }]
                })
              }
            } catch (e) {}
          }
        }
      }

      if (adminData?.id && fullAiResponse && currentThreadId) {
        fetch('/api/chat/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: adminData.id, threadId: currentThreadId, role: 'assistant', content: fullAiResponse })
        }).catch(console.error)
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(error)
        let errMsg = error.message;
        if (errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
          alert('Batas pemakaian AI gratis telah tercapai. Harap tunggu beberapa detik atau menit sebelum mencoba lagi.');
        } else if (errMsg.includes('503') || errMsg.includes('high demand')) {
          alert('Server AI Google saat ini sedang sangat sibuk karena tingginya permintaan. Mohon tunggu beberapa saat lalu coba lagi.');
        } else {
          alert(`Failed to connect to AI: ${errMsg}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, stop, clearChat, threads, activeThreadId, loadThread, createNewChat, updateThread, deleteThread, customApiKey, setCustomApiKey }
}

export function AiPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput, stop, clearChat, threads, activeThreadId, loadThread, createNewChat, updateThread, deleteThread, customApiKey, setCustomApiKey } = useChat()

  const isTyping = isLoading;

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const openSettings = () => {
    setTempApiKey(customApiKey);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    setCustomApiKey(tempApiKey);
    if (tempApiKey.trim() === '') {
      localStorage.removeItem('custom_gemini_api_key');
    } else {
      localStorage.setItem('custom_gemini_api_key', tempApiKey.trim());
    }
    setIsSettingsOpen(false);
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim()) return
    handleSubmit(e as any)
  }

  const startEditing = (thread: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
    setOpenDropdownId(null);
  };

  const saveEdit = async (threadId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      await updateThread(threadId, { title: editTitle.trim() });
    }
    setEditingThreadId(null);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      
      {/* Sidebar - Chat History */}
      <div className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" />
            <span>AI Assistant</span>
          </div>
          <button onClick={createNewChat} className="flex size-7 items-center justify-center rounded-md hover:bg-muted">
            <Edit3 className="size-4" />
          </button>
        </div>
        
        <div className="p-3">
          <button onClick={createNewChat} className="flex w-full items-center gap-2 rounded-lg border border-border border-dashed bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <Plus className="size-4" />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Recent Chats</div>
          <div className="space-y-1">
            {threads.map((chat) => (
              <div key={chat.id} className="relative">
                {editingThreadId === chat.id ? (
                  <form onSubmit={(e) => saveEdit(chat.id, e)} className="flex items-center px-2 py-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(chat.id)}
                      autoFocus
                      className="w-full rounded bg-background px-2 py-1 text-sm outline-none ring-1 ring-primary"
                    />
                  </form>
                ) : (
                  <button 
                    onClick={() => loadThread(chat.id)}
                    className={`group flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted ${activeThreadId === chat.id ? 'bg-muted font-medium' : ''}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {chat.is_pinned ? (
                        <Pin className="size-3.5 shrink-0 text-primary" />
                      ) : (
                        <MessageSquare className={`size-3.5 shrink-0 ${activeThreadId === chat.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                      <span className="truncate text-foreground/80 group-hover:text-foreground">{chat.title}</span>
                    </div>
                    <div 
                      className="relative flex h-full items-center p-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.nativeEvent) {
                          e.nativeEvent.stopImmediatePropagation();
                        }
                        setOpenDropdownId(openDropdownId === chat.id ? null : chat.id);
                      }}
                    >
                      <MoreVertical className={`size-3.5 shrink-0 transition-opacity ${openDropdownId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </button>
                )}

                {/* Dropdown Menu */}
                {openDropdownId === chat.id && (
                  <div 
                    className="absolute right-0 top-10 z-50 w-36 rounded-md border border-border bg-card p-1 shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                    }}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateThread(chat.id, { is_pinned: !chat.is_pinned });
                        setOpenDropdownId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      {chat.is_pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                      {chat.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button 
                      onClick={(e) => startEditing(chat, e)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <Edit2 className="size-3" />
                      Rename
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setThreadToDelete(chat.id);
                        setOpenDropdownId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        <Dialog open={!!threadToDelete} onOpenChange={(open) => !open && setThreadToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-red-500" />
                Delete Chat
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone and all messages will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setThreadToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                if (threadToDelete) deleteThread(threadToDelete);
                setThreadToDelete(null);
              }}>
                Delete Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>AI Settings</DialogTitle>
              <DialogDescription>
                Customize your AI assistant preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="apiKey" className="flex items-center gap-2 text-foreground/80">
                  <Key className="size-4" />
                  Custom Gemini API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="font-mono text-sm"
                />
                <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
                  By default, we use our shared key. If you face quota limits, provide your own free Gemini API key to get uninterrupted access. It is stored safely on your device.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-2 sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveSettings}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="border-t border-border p-3">
          <button onClick={clearChat} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Trash2 className="size-4" />
            Clear Conversations
          </button>
          <button onClick={openSettings} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Settings className="size-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col bg-background">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" />
            <span>AI Assistant</span>
          </div>
          <button className="flex size-8 items-center justify-center rounded-md border border-border bg-card">
            <Plus className="size-4" />
          </button>
        </div>

        {/* Chat Messages / Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">How can I help you today?</h2>
              <p className="mb-10 text-center text-muted-foreground">I can answer questions, help with code, or summarize data.</p>
              
              <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
                {suggestions.map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSubmit(undefined, item.description)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                      <item.icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                  </div>
                  <div className={`flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground'}`}>
                    {renderMarkdown(msg.content, (src) => setLightboxImage(src))}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted/50 px-4 py-3">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4 sm:p-6">
          <form onSubmit={handleSend} className="mx-auto max-w-3xl">
            <div className="relative flex items-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
              <button type="button" className="flex h-12 w-12 items-center justify-center text-muted-foreground hover:text-foreground">
                <Paperclip className="size-5" />
              </button>
              
              <input 
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask anything or search for data..."
                className="flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              
              {isTyping ? (
                <button type="button" onClick={() => stop()} className="mr-2 flex size-8 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/80">
                  <StopCircle className="size-4" />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="mr-2 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              )}
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              AI can make mistakes. Consider verifying important information.
            </div>
          </form>
        </div>
      </div>
      
      {/* Lightbox for Images */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm transition-all"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative flex w-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            
            <div className="absolute -top-14 right-0 flex gap-3">
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch(lightboxImage);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `haimotion-ai-image-${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('Failed to download image:', e);
                    // Fallback to opening in new tab
                    window.open(lightboxImage, '_blank');
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 backdrop-blur-md"
                title="Download image"
              >
                <Download className="size-5" />
              </button>
              
              <button 
                onClick={() => setLightboxImage(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 backdrop-blur-md"
                title="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <img 
              src={lightboxImage} 
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" 
              alt="Enlarged view" 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AiPage
