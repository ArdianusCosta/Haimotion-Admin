'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ChevronRight, Plus, Search, Grid2X2, List, 
  Folder as FolderIcon, FileImage, FileSpreadsheet, File as FileIcon, 
  MoreHorizontal, Download, Trash2, Edit2, Share2, Star, ArrowRight, X, HelpCircle,
  Map, UploadCloud, Move
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ShareDialog } from './share-dialog'

interface FileManagerProps {
  user: any;
}

export default function FileManager({ user }: FileManagerProps) {
  const queryClient = useQueryClient()
  const userId = user?.id

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [folderHistory, setFolderHistory] = useState<{id: number | null, name: string}[]>([{ id: null, name: 'File Manager' }])
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<string | null>(null) // null, 'starred', 'recent', 'shared'

  // Fetch Preferences
  const { data: prefData } = useQuery({
    queryKey: ['file-manager-pref', userId],
    queryFn: async () => {
      const res = await fetch(`/api/file-manager/preferences?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch pref')
      return res.json()
    },
    enabled: !!userId,
  })

  useEffect(() => {
    if (prefData?.preference?.file_manager_view_mode) {
      setView(prefData.preference.file_manager_view_mode)
    }
  }, [prefData])

  const prefMutation = useMutation({
    mutationFn: async (newView: 'grid' | 'list') => {
      const res = await fetch('/api/file-manager/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, file_manager_view_mode: newView })
      })
      if (!res.ok) throw new Error('Failed to update pref')
      return res.json()
    }
  })

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView)
    if (userId) {
      prefMutation.mutate(newView)
    }
  }

  // Fetch Folders
  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ['file-manager-folders', userId, currentFolderId],
    queryFn: async () => {
      let url = `/api/file-manager/folders?userId=${userId}`
      if (currentFolderId) url += `&parentId=${currentFolderId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch folders')
      return res.json()
    },
    enabled: !!userId && !filter && !query, // Only fetch folders if no search/filter active
  })

  // Fetch Files
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ['file-manager-files', userId, currentFolderId, query, filter],
    queryFn: async () => {
      let url = `/api/file-manager/files?userId=${userId}`
      if (query) url += `&search=${encodeURIComponent(query)}`
      else if (filter) url += `&filter=${filter}`
      else if (currentFolderId) url += `&folderId=${currentFolderId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch files')
      return res.json()
    },
    enabled: !!userId,
  })

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['file-manager-stats', userId],
    queryFn: async () => {
      const res = await fetch(`/api/file-manager/stats?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: !!userId,
  })

  // Mutations
  const createFolderMut = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/file-manager/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolderId, userId })
      })
      if (!res.ok) throw new Error('Failed to create folder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-folders'] })
      setCreateFolderOpen(false)
      setNewFolderName('')
      toast.success('Folder created successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const uploadFilesMut = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData()
      formData.append('userId', String(userId))
      if (currentFolderId) formData.append('folderId', String(currentFolderId))
      Array.from(files).forEach(f => formData.append('files', f))
      
      const res = await fetch('/api/file-manager/files/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload files')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-files'] })
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] })
      setUploadOpen(false)
      toast.success('Files uploaded successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const deleteFileMut = useMutation({
    mutationFn: async (fileId: number) => {
      const res = await fetch(`/api/file-manager/files/${fileId}?userId=${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete file')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-files'] })
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] })
      toast.success('File deleted successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const updateFileMut = useMutation({
    mutationFn: async ({ id, action, payload }: { id: number, action: string, payload: any }) => {
      const res = await fetch(`/api/file-manager/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...payload })
      })
      if (!res.ok) throw new Error(`Failed to ${action} file`)
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-files'] })
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] })
      toast.success(`File ${variables.action === 'star' ? 'star status updated' : variables.action + 'd'} successfully`)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const deleteFolderMut = useMutation({
    mutationFn: async (folderId: number) => {
      const res = await fetch(`/api/file-manager/folders/${folderId}?userId=${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete folder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-folders'] })
      toast.success('Folder deleted successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const updateFolderMut = useMutation({
    mutationFn: async ({ id, action, payload }: { id: number, action: string, payload: any }) => {
      const res = await fetch(`/api/file-manager/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...payload })
      })
      if (!res.ok) throw new Error(`Failed to ${action} folder`)
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-folders'] })
      toast.success(`Folder ${variables.action + 'd'} successfully`)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  // States for Dialogs
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  
  const [actionItem, setActionItem] = useState<{ id: string, dbId: number, name: string, kind: string } | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveTargetId, setMoveTargetId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)
    return () => {
      window.removeEventListener('dragover', preventDefault)
      window.removeEventListener('drop', preventDefault)
    }
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      dragCounter.current += 1
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFilesMut.mutate(e.dataTransfer.files)
    }
  }

  // Navigate folder
  const navigateFolder = (id: number | null, name: string) => {
    if (id === null) {
      setFolderHistory([{ id: null, name: 'File Manager' }])
      setCurrentFolderId(null)
    } else {
      const idx = folderHistory.findIndex(h => h.id === id)
      if (idx >= 0) {
        setFolderHistory(folderHistory.slice(0, idx + 1))
      } else {
        setFolderHistory([...folderHistory, { id, name }])
      }
      setCurrentFolderId(id)
    }
    setQuery('')
    setFilter(null)
  }

  // Compute combined items
  const combinedItems = useMemo(() => {
    let items = []
    
    // Add folders if not filtering/searching (or if filter is 'shared')
    if (!query && (!filter || filter === 'shared') && foldersData?.folders) {
      items.push(...foldersData.folders.map((f: any) => ({
        id: `folder-${f.id}`,
        dbId: f.id,
        name: f.name,
        type: 'Folder',
        size: '-',
        kind: 'folder',
        updatedAt: f.updated_at,
        permission: f.permission || 'owner',
        sharedBy: f.sharedBy
      })))
    }
    
    // Add files
    if (filesData?.files) {
      items.push(...filesData.files.map((f: any) => {
        let kind = 'file'
        if (f.mime_type?.includes('image')) kind = 'image'
        else if (f.mime_type?.includes('spreadsheet') || f.mime_type?.includes('excel') || f.mime_type?.includes('csv')) kind = 'sheet'
        else if (f.mime_type?.includes('pdf')) kind = 'pdf'
        else if (f.mime_type?.includes('video')) kind = 'video'

        const sizeMB = (Number(f.size) / (1024 * 1024)).toFixed(1) + ' MB'

        return {
          id: `file-${f.id}`,
          dbId: f.id,
          name: f.original_name,
          type: f.extension ? f.extension.toUpperCase() : 'File',
          size: sizeMB,
          kind,
          isStarred: f.is_starred,
          updatedAt: f.updated_at,
          fileData: f,
          permission: f.permission || 'owner',
          sharedBy: f.sharedBy
        }
      }))
    }
    
    return items
  }, [foldersData, filesData, query, filter])

  const isLoading = foldersLoading || filesLoading

  return (
    <div 
      className="relative min-h-[500px]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center text-primary">
            <Download className="size-10 mb-4 animate-bounce" />
            <h2 className="text-xl font-semibold">Drop files here to upload</h2>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace</span>
            {folderHistory.map((h, i) => (
              <React.Fragment key={h.id || 'root'}>
                <ChevronRight className="size-3" />
                <button 
                  onClick={() => navigateFolder(h.id, h.name)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('application/json'))
                      if (data.dbId === h.id && data.kind === 'folder') return
                      if (data.kind === 'folder') {
                        updateFolderMut.mutate({ id: data.dbId, action: 'move', payload: { parentId: h.id } })
                      } else {
                        updateFileMut.mutate({ id: data.dbId, action: 'move', payload: { folderId: h.id } })
                      }
                    } catch (err) {}
                  }}
                  className={`hover:underline p-1 -m-1 rounded-sm border border-transparent hover:bg-muted transition-colors ${i === folderHistory.length - 1 ? 'text-foreground font-medium' : ''}`}
                >
                  {h.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {filter === 'starred' ? 'Starred files' : filter === 'recent' ? 'Recent activity' : filter === 'shared' ? 'Shared with me' : 'File manager'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize and access your team&apos;s shared files.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)} className="flex items-center gap-2">
            <Plus className="size-4" />New folder
          </Button>
          <Button onClick={() => setUploadOpen(true)} className="flex items-center gap-2">
            <Plus className="size-4" />Upload files
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 flex-1 sm:w-80">
            <Search className="size-4 text-muted-foreground" />
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Search files" 
              className="w-full bg-transparent text-sm outline-none" 
            />
          </div>
          <button 
            onClick={() => setHelpOpen(true)} 
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors shrink-0" 
            title="How to use File Manager"
          >
            <HelpCircle className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button 
            onClick={() => handleViewChange('grid')} 
            className={`rounded-md p-2 ${view === 'grid' ? 'bg-muted' : 'text-muted-foreground'}`} 
            aria-label="Grid view"
          >
            <Grid2X2 className="size-4" />
          </button>
          <button 
            onClick={() => handleViewChange('list')} 
            className={`rounded-md p-2 ${view === 'list' ? 'bg-muted' : 'text-muted-foreground'}`} 
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {!query && !filter && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Storage used</p>
            <p className="mt-2 text-xl font-semibold">
              {statsData?.storageUsedGB ?? '0.0'} GB <span className="text-xs font-normal text-muted-foreground">/ {statsData?.maxStorageGB ?? 100} GB</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-primary" 
                style={{ width: `${Math.min(100, ((statsData?.storageUsedGB || 0) / (statsData?.maxStorageGB || 100)) * 100)}%` }} 
              />
            </div>
          </div>
          <div 
            className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => { setFilter('shared'); setQuery(''); setCurrentFolderId(null); }}
          >
            <p className="text-xs text-muted-foreground">Shared with me</p>
            <p className="mt-2 text-xl font-semibold">
              {statsData?.sharedFilesCount ?? '--'} <span className="text-xs font-normal text-muted-foreground">files</span>
            </p>
          </div>
          <div 
            className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => { setFilter('recent'); setQuery(''); setCurrentFolderId(null); }}
          >
            <p className="text-xs text-muted-foreground">Recent activity</p>
            <p className="mt-2 text-xl font-semibold">
              {statsData?.recentActivityCount ?? '--'} <span className="text-xs font-normal text-muted-foreground">updates</span>
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'}>
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className={view === 'grid' ? 'h-32 rounded-xl' : 'h-16 rounded-xl'} />
          ))}
        </div>
      ) : combinedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <FolderIcon className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No files here yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Upload a file or create a new folder to get started.
          </p>
          <Button onClick={() => setUploadOpen(true)}>Upload File</Button>
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'}>
          {combinedItems.map((item) => (
            <div 
              key={item.id} 
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ dbId: item.dbId, kind: item.kind }))
              }}
              onDragOver={(e) => {
                if (item.kind === 'folder') {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onDrop={(e) => {
                if (item.kind === 'folder') {
                  e.preventDefault()
                  e.stopPropagation()
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'))
                    if (data.dbId === item.dbId && data.kind === 'folder') return // cannot move to itself
                    if (data.kind === 'folder') {
                      updateFolderMut.mutate({ id: data.dbId, action: 'move', payload: { parentId: item.dbId } })
                    } else {
                      updateFileMut.mutate({ id: data.dbId, action: 'move', payload: { folderId: item.dbId } })
                    }
                  } catch (err) {
                    // Not an internal drag
                  }
                }
              }}
              className={`group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30 ${view === 'grid' ? 'flex-col items-start' : ''}`}
            >
              <div 
                className="flex w-full items-center gap-3 cursor-pointer"
                onClick={() => {
                  if (item.kind === 'folder') {
                    navigateFolder(item.dbId, item.name)
                  } else {
                    // Preview file logic
                  }
                }}
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.kind === 'folder' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {item.kind === 'folder' ? <FolderIcon className="size-5" /> : 
                   item.kind === 'image' ? <FileImage className="size-5" /> : 
                   item.kind === 'sheet' ? <FileSpreadsheet className="size-5" /> : 
                   <FileIcon className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium flex items-center gap-2">
                    {item.name}
                    {item.isStarred && <Star className="size-3 text-yellow-500 fill-yellow-500" />}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.type} {item.kind !== 'folder' && `· ${item.size}`}
                    {filter === 'shared' && item.sharedBy && ` · Shared by ${item.sharedBy} (${item.permission})`}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100" 
                    aria-label={`More options for ${item.name}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {item.kind !== 'folder' && (
                      <>
                        <DropdownMenuItem onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const res = await fetch(`/api/file-manager/files/${item.dbId}/download?userId=${userId}`)
                            const data = await res.json()
                            if (data.url) {
                              const a = document.createElement('a')
                              a.href = data.url
                              a.download = data.originalName
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              toast.success('Download started')
                            }
                          } catch (err) {
                            console.error('Download failed', err)
                            toast.error('Failed to download file')
                          }
                        }}>
                          <Download className="mr-2 size-4" /> Download
                        </DropdownMenuItem>
                        
                        {(item.permission === 'owner' || item.permission === 'manager' || item.permission === 'editor') && (
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              updateFileMut.mutate({ id: item.dbId, action: 'star', payload: { is_starred: !item.isStarred } })
                            }}>
                              <Star className="mr-2 size-4" /> {item.isStarred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setRenameValue(item.name)
                              setRenameOpen(true)
                            }}>
                              <Edit2 className="mr-2 size-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setMoveOpen(true)
                            }}>
                              <ArrowRight className="mr-2 size-4" /> Move
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {(item.permission === 'owner' || item.permission === 'manager') && (
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setShareOpen(true)
                            }}>
                              <Share2 className="mr-2 size-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setDeleteOpen(true)
                            }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                    {item.kind === 'folder' && (
                      <>
                        <DropdownMenuItem onClick={(e) => {
                           e.stopPropagation()
                           navigateFolder(item.dbId, item.name)
                        }}>
                           <FolderIcon className="mr-2 size-4" /> Open
                        </DropdownMenuItem>

                        {(item.permission === 'owner' || item.permission === 'manager' || item.permission === 'editor') && (
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setRenameValue(item.name)
                              setRenameOpen(true)
                            }}>
                              <Edit2 className="mr-2 size-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setMoveOpen(true)
                            }}>
                              <ArrowRight className="mr-2 size-4" /> Move
                            </DropdownMenuItem>
                          </>
                        )}

                        {(item.permission === 'owner' || item.permission === 'manager') && (
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setShareOpen(true)
                            }}>
                              <Share2 className="mr-2 size-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              setActionItem({ id: item.id, dbId: item.dbId, name: item.name, kind: item.kind })
                              setDeleteOpen(true)
                            }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {view === 'grid' && (
                <div className="mt-3 flex w-full items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  <button className="font-medium text-primary">Open</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input 
              id="folderName" 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="e.g. Design Assets"
              onKeyDown={e => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolderMut.mutate(newFolderName)
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createFolderMut.mutate(newFolderName)} 
              disabled={!newFolderName.trim() || createFolderMut.isPending}
            >
              {createFolderMut.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>Select files to upload to the current folder.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="file" 
              multiple 
              id="fileUpload" 
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadFilesMut.mutate(e.target.files)
                }
              }} 
            />
            {uploadFilesMut.isPending && (
              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {actionItem?.kind === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={renameValue} 
              onChange={e => setRenameValue(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  if (actionItem?.kind === 'folder') {
                    updateFolderMut.mutate({ id: actionItem.dbId, action: 'rename', payload: { name: renameValue } }, { onSuccess: () => setRenameOpen(false) })
                  } else if (actionItem?.dbId) {
                    updateFileMut.mutate({ id: actionItem.dbId, action: 'rename', payload: { name: renameValue } }, { onSuccess: () => setRenameOpen(false) })
                  }
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (actionItem?.kind === 'folder') {
                  updateFolderMut.mutate({ id: actionItem.dbId, action: 'rename', payload: { name: renameValue } }, { onSuccess: () => setRenameOpen(false) })
                } else if (actionItem?.dbId) {
                  updateFileMut.mutate({ id: actionItem.dbId, action: 'rename', payload: { name: renameValue } }, { onSuccess: () => setRenameOpen(false) })
                }
              }} 
              disabled={!renameValue.trim() || updateFileMut.isPending || updateFolderMut.isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {actionItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
            <div 
              className={`p-2 rounded cursor-pointer flex items-center gap-2 ${moveTargetId === null ? 'bg-muted' : 'hover:bg-muted/50'}`}
              onClick={() => setMoveTargetId(null)}
            >
              <FolderIcon className="size-4 text-primary" /> Root Directory
            </div>
            {foldersData?.folders?.filter((f: any) => f.id !== actionItem?.dbId).map((f: any) => (
              <div 
                key={f.id}
                className={`p-2 rounded cursor-pointer flex items-center gap-2 ${moveTargetId === f.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                onClick={() => setMoveTargetId(f.id)}
              >
                <FolderIcon className="size-4 text-primary" /> {f.name}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (actionItem?.kind === 'folder') {
                  updateFolderMut.mutate({ id: actionItem.dbId, action: 'move', payload: { parentId: moveTargetId } }, { onSuccess: () => setMoveOpen(false) })
                } else if (actionItem?.dbId) {
                  updateFileMut.mutate({ id: actionItem.dbId, action: 'move', payload: { folderId: moveTargetId } }, { onSuccess: () => setMoveOpen(false) })
                }
              }} 
              disabled={updateFileMut.isPending || updateFolderMut.isPending}
            >
              Move Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {actionItem?.kind === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{actionItem?.name}"? This action cannot be undone.
              {actionItem?.kind === 'folder' && " All contents inside this folder will also be deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (actionItem?.kind === 'folder') {
                  deleteFolderMut.mutate(actionItem.dbId, { onSuccess: () => setDeleteOpen(false) })
                } else if (actionItem?.dbId) {
                  deleteFileMut.mutate(actionItem.dbId, { onSuccess: () => setDeleteOpen(false) })
                }
              }} 
              disabled={deleteFileMut.isPending || deleteFolderMut.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-3xl p-6 sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <HelpCircle className="size-7 text-primary" /> How to use File Manager
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 grid grid-cols-1 sm:grid-cols-2 gap-6 text-base text-muted-foreground">
            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors flex flex-col gap-2">
              <h4 className="font-semibold text-foreground flex items-center gap-3 text-lg"><Map className="size-6 text-primary/80" /> Navigation</h4>
              <p className="leading-relaxed">Click on any folder to open it. To go back, simply click on the folder names at the top (e.g. Workspace {'>'} File Manager).</p>
            </div>
            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors flex flex-col gap-2">
              <h4 className="font-semibold text-foreground flex items-center gap-3 text-lg"><UploadCloud className="size-6 text-primary/80" /> Upload Files</h4>
              <p className="leading-relaxed">You can click the "Upload files" button, OR simply <b>drag and drop</b> files from your computer directly anywhere into this window.</p>
            </div>
            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors flex flex-col gap-2">
              <h4 className="font-semibold text-foreground flex items-center gap-3 text-lg"><Move className="size-6 text-primary/80" /> Move Files & Folders</h4>
              <p className="leading-relaxed">Click and hold a file, then drag it over a folder to move it there. You can also drop it on the folder names at the top to move it back!</p>
            </div>
            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors flex flex-col gap-2">
              <h4 className="font-semibold text-foreground flex items-center gap-3 text-lg"><MoreHorizontal className="size-6 text-primary/80" /> More Actions</h4>
              <p className="leading-relaxed">Hover over a file and click the <b>three dots (...)</b> menu to Rename, Download, Delete, or Star your important files.</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => setHelpOpen(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ShareDialog 
        open={shareOpen} 
        onOpenChange={setShareOpen}
        itemId={actionItem?.dbId || null}
        itemType={actionItem?.kind === 'folder' ? 'folder' : 'file'}
        itemName={actionItem?.name || ''}
        userId={userId}
      />
    </div>
  )
}
