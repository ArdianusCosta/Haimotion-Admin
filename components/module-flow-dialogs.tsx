import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface NodeFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: any
  isSubmitting?: boolean
}

export function NodeFormDialog({ isOpen, onClose, onSubmit, initialData, isSubmitting }: NodeFormDialogProps) {
  const [formData, setFormData] = useState({
    label: '',
    type: 'customNode',
    tech: '',
    owner: '',
    status: 'planned',
    description: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        label: initialData.label || '',
        type: initialData.type || 'customNode',
        tech: initialData.tech || '',
        owner: initialData.owner || '',
        status: initialData.status || 'planned',
        description: initialData.description || ''
      })
    } else {
      setFormData({
        label: '',
        type: 'customNode',
        tech: '',
        owner: '',
        status: 'planned',
        description: ''
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      // For XYFlow, if it's a condition node, we must pass type 'condition' to XYFlow, 
      // but in our DB it's stored under 'type' anyway.
      // Position defaults
      position_x: initialData?.position_x ?? 250,
      position_y: initialData?.position_y ?? 250
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Step' : 'Add Step'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="label">Step Name *</Label>
            <Input id="label" required value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type">Node Type</Label>
            <select 
              id="type" 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.type} 
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="ui">UI Component</option>
              <option value="api">API Endpoint</option>
              <option value="service">Service</option>
              <option value="database">Database</option>
              <option value="validation">Validation</option>
              <option value="condition">Condition</option>
              <option value="customNode">Generic Step</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tech">Technology</Label>
              <Input id="tech" placeholder="e.g. Next.js" value={formData.tech} onChange={(e) => setFormData({ ...formData, tech: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="owner">Assignee</Label>
            <Input id="owner" placeholder="Name" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={3} 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Step
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
