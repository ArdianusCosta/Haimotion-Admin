'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export function ConfirmDeleteDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Apakah Anda yakin?", 
  description = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.",
  confirmText = "Hapus",
  cancelText = "Batal",
  isLoading = false
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[92vw] !max-w-[440px] p-6 rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6 pt-4 border-t border-border">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            disabled={isLoading}
            onClick={async () => { 
              await onConfirm(); 
              onOpenChange(false); 
            }}
            className="h-10 px-5 font-semibold bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
          >
            {isLoading ? 'Menghapus...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDeleteDialog as ConfirmDeleteModal }
