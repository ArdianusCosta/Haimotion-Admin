'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Folder as FolderIcon, HelpCircle, Map, UploadCloud, Move, MoreHorizontal } from 'lucide-react'
import { ActionItem } from '@/types/file-manager'

type CreateFolderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  newFolderName: string
  setNewFolderName: (name: string) => void
  onCreate: (name: string) => void
  isPending: boolean
}

export function CreateFolderDialog({ open, onOpenChange, newFolderName, setNewFolderName, onCreate, isPending }: CreateFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onCreate(newFolderName)
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => onCreate(newFolderName)} 
            disabled={!newFolderName.trim() || isPending}
          >
            {isPending ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type UploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: FileList) => void
  isPending: boolean
}

export function UploadDialog({ open, onOpenChange, onUpload, isPending }: UploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onUpload(e.target.files)
              }
            }} 
          />
          {isPending && (
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type RenameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionItem: ActionItem | null
  renameValue: string
  setRenameValue: (val: string) => void
  onRename: () => void
  isPending: boolean
}

export function RenameDialog({ open, onOpenChange, actionItem, renameValue, setRenameValue, onRename, isPending }: RenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onRename()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={onRename} 
            disabled={!renameValue.trim() || isPending}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type MoveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionItem: ActionItem | null
  folders: any[]
  moveTargetId: number | null
  setMoveTargetId: (id: number | null) => void
  onMove: () => void
  isPending: boolean
}

export function MoveDialog({ open, onOpenChange, actionItem, folders, moveTargetId, setMoveTargetId, onMove, isPending }: MoveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {folders?.filter((f: any) => f.id !== actionItem?.dbId).map((f: any) => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={onMove} 
            disabled={isPending}
          >
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionItem: ActionItem | null
  onDelete: () => void
  isPending: boolean
}

export function DeleteDialog({ open, onOpenChange, actionItem, onDelete, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {actionItem?.kind === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{actionItem?.name}"? This action cannot be undone.
            {actionItem?.kind === 'folder' && " All contents inside this folder will also be deleted."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            variant="destructive"
            onClick={onDelete} 
            disabled={isPending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type HelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => onOpenChange(false)}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
