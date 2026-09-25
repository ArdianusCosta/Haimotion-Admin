'use client'

import React from 'react'
import { Folder as FolderIcon, FileImage, FileSpreadsheet, File as FileIcon, MoreHorizontal, Download, Trash2, Edit2, Share2, Star, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileItem, ActionItem } from '@/types/file-manager'

type FileGridProps = {
  view: 'grid' | 'list'
  isLoading: boolean
  combinedItems: FileItem[]
  filter: string | null
  userId: number | undefined
  setUploadOpen: (open: boolean) => void
  navigateFolder: (id: number | null, name: string) => void
  setActionItem: (item: ActionItem) => void
  setRenameValue: (val: string) => void
  setRenameOpen: (open: boolean) => void
  setMoveOpen: (open: boolean) => void
  setShareOpen: (open: boolean) => void
  setDeleteOpen: (open: boolean) => void
  updateFolderMut: any
  updateFileMut: any
}

export function FileGrid({ 
  view, isLoading, combinedItems, filter, userId, 
  setUploadOpen, navigateFolder, setActionItem, setRenameValue, 
  setRenameOpen, setMoveOpen, setShareOpen, setDeleteOpen,
  updateFolderMut, updateFileMut
}: FileGridProps) {
  if (isLoading) {
    return (
      <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'}>
        {[1,2,3,4,5,6].map(i => (
          <Skeleton key={i} className={view === 'grid' ? 'h-32 rounded-xl' : 'h-16 rounded-xl'} />
        ))}
      </div>
    )
  }

  if (combinedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
        <FolderIcon className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No files here yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Upload a file or create a new folder to get started.
        </p>
        <Button onClick={() => setUploadOpen(true)}>Upload File</Button>
      </div>
    )
  }

  return (
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
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.type} {item.kind !== 'folder' && `· ${item.size}`}</span>
                {filter === 'shared' && item.sharedBy && <span>· Shared by {item.sharedBy} ({item.permission})</span>}
                {item.shares && item.shares.length > 0 && (
                  <span className="flex items-center gap-1.5 ml-2 border-l border-border pl-2">
                    <span className="flex -space-x-1.5">
                      {item.shares.slice(0, 3).map((share: any) => (
                        <Avatar key={share.shared_with_user?.id || share.id} className="size-5 border-2 border-card ring-0">
                          <AvatarImage src={share.shared_with_user?.avatar || ''} />
                          <AvatarFallback className="text-[9px] font-medium uppercase">{share.shared_with_user?.firstname?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                      ))}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {item.shares.length} {item.shares.length === 1 ? 'person' : 'people'}
                    </span>
                  </span>
                )}
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
  )
}
