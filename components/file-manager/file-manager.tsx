'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import { useFileManagerPrefs, useUpdatePrefs, useFolders, useFiles, useStats, useCreateFolder, useUploadFiles, useDeleteFile, useUpdateFile, useDeleteFolder, useUpdateFolder } from '@/hooks/use-file-manager'
import { FileItem, ActionItem } from '@/types/file-manager'
import { FileManagerHeader } from './file-manager-header'
import { FileManagerStats } from './file-manager-stats'
import { FileGrid } from './file-grid'
import { ShareDialog } from './share-dialog'
import { CreateFolderDialog, UploadDialog, RenameDialog, MoveDialog, DeleteDialog, HelpDialog } from './dialogs/file-manager-dialogs'

interface FileManagerProps {
  user: any;
}

export default function FileManager({ user }: FileManagerProps) {
  const userId = user?.id

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [folderHistory, setFolderHistory] = useState<{id: number | null, name: string}[]>([{ id: null, name: 'File Manager' }])
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<string | null>(null) 

  // Data Hooks
  const { data: prefData } = useFileManagerPrefs(userId)
  const prefMutation = useUpdatePrefs()
  
  const { data: foldersData, isLoading: foldersLoading } = useFolders(userId, currentFolderId, filter, query)
  const { data: filesData, isLoading: filesLoading } = useFiles(userId, currentFolderId, query, filter)
  const { data: statsData } = useStats(userId)

  // Sync Preferences
  useEffect(() => {
    if (prefData?.preference?.file_manager_view_mode) {
      setView(prefData.preference.file_manager_view_mode)
    }
  }, [prefData])

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView)
    if (userId) {
      prefMutation.mutate({ userId, file_manager_view_mode: newView })
    }
  }

  // Dialog States
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [actionItem, setActionItem] = useState<ActionItem | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveTargetId, setMoveTargetId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  // Mutations
  const createFolderMut = useCreateFolder(userId, currentFolderId, () => {
    setCreateFolderOpen(false)
    setNewFolderName('')
  })
  const uploadFilesMut = useUploadFiles(userId, currentFolderId, () => setUploadOpen(false))
  const deleteFileMut = useDeleteFile(userId, () => setDeleteOpen(false))
  const updateFileMut = useUpdateFile(userId, (action) => {
    if (action === 'rename') setRenameOpen(false)
    if (action === 'move') setMoveOpen(false)
  })
  const deleteFolderMut = useDeleteFolder(userId, () => setDeleteOpen(false))
  const updateFolderMut = useUpdateFolder(userId, (action) => {
    if (action === 'rename') setRenameOpen(false)
    if (action === 'move') setMoveOpen(false)
  })

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
    let items: FileItem[] = []
    
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
        sharedBy: f.sharedBy,
        shares: f.shares || []
      })))
    }
    
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
          sharedBy: f.sharedBy,
          shares: f.shares || []
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
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
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

      <FileManagerHeader 
        folderHistory={folderHistory}
        filter={filter}
        query={query}
        setQuery={setQuery}
        view={view}
        handleViewChange={handleViewChange}
        navigateFolder={navigateFolder}
        setCreateFolderOpen={setCreateFolderOpen}
        setUploadOpen={setUploadOpen}
        setHelpOpen={setHelpOpen}
        updateFolderMut={updateFolderMut}
        updateFileMut={updateFileMut}
      />

      {!query && !filter && (
        <FileManagerStats 
          statsData={statsData}
          setFilter={setFilter}
          setQuery={setQuery}
          setCurrentFolderId={setCurrentFolderId}
        />
      )}

      <FileGrid 
        view={view}
        isLoading={isLoading}
        combinedItems={combinedItems}
        filter={filter}
        userId={userId}
        setUploadOpen={setUploadOpen}
        navigateFolder={navigateFolder}
        setActionItem={setActionItem}
        setRenameValue={setRenameValue}
        setRenameOpen={setRenameOpen}
        setMoveOpen={setMoveOpen}
        setShareOpen={setShareOpen}
        setDeleteOpen={setDeleteOpen}
        updateFolderMut={updateFolderMut}
        updateFileMut={updateFileMut}
      />

      <CreateFolderDialog 
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onCreate={(name) => createFolderMut.mutate(name)}
        isPending={createFolderMut.isPending}
      />

      <UploadDialog 
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(files) => uploadFilesMut.mutate(files)}
        isPending={uploadFilesMut.isPending}
      />

      <RenameDialog 
        open={renameOpen}
        onOpenChange={setRenameOpen}
        actionItem={actionItem}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        onRename={() => {
          if (actionItem?.kind === 'folder') {
            updateFolderMut.mutate({ id: actionItem.dbId, action: 'rename', payload: { name: renameValue } })
          } else if (actionItem?.dbId) {
            updateFileMut.mutate({ id: actionItem.dbId, action: 'rename', payload: { name: renameValue } })
          }
        }}
        isPending={updateFileMut.isPending || updateFolderMut.isPending}
      />

      <MoveDialog 
        open={moveOpen}
        onOpenChange={setMoveOpen}
        actionItem={actionItem}
        folders={foldersData?.folders || []}
        moveTargetId={moveTargetId}
        setMoveTargetId={setMoveTargetId}
        onMove={() => {
          if (actionItem?.kind === 'folder') {
            updateFolderMut.mutate({ id: actionItem.dbId, action: 'move', payload: { parentId: moveTargetId } })
          } else if (actionItem?.dbId) {
            updateFileMut.mutate({ id: actionItem.dbId, action: 'move', payload: { folderId: moveTargetId } })
          }
        }}
        isPending={updateFileMut.isPending || updateFolderMut.isPending}
      />

      <DeleteDialog 
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        actionItem={actionItem}
        onDelete={() => {
          if (actionItem?.kind === 'folder') {
            deleteFolderMut.mutate(actionItem.dbId)
          } else if (actionItem?.dbId) {
            deleteFileMut.mutate(actionItem.dbId)
          }
        }}
        isPending={deleteFileMut.isPending || deleteFolderMut.isPending}
      />

      <HelpDialog 
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />

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
