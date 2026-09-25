'use client'

import React from 'react'
import { ChevronRight, Plus, Search, Grid2X2, List, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FileManagerHeaderProps = {
  folderHistory: {id: number | null, name: string}[]
  filter: string | null
  query: string
  setQuery: (q: string) => void
  view: 'grid' | 'list'
  handleViewChange: (v: 'grid' | 'list') => void
  navigateFolder: (id: number | null, name: string) => void
  setCreateFolderOpen: (open: boolean) => void
  setUploadOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  updateFolderMut: any
  updateFileMut: any
}

export function FileManagerHeader({
  folderHistory, filter, query, setQuery, view, handleViewChange,
  navigateFolder, setCreateFolderOpen, setUploadOpen, setHelpOpen,
  updateFolderMut, updateFileMut
}: FileManagerHeaderProps) {
  return (
    <>
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
    </>
  )
}
