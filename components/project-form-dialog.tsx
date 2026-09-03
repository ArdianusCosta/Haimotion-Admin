'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, updateProject } from '@/app/actions/projects'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function ProjectFormDialog({ 
  open, 
  onOpenChange,
  project,
  users = []
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  project?: any;
  users?: any[];
}) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 1, // Default status
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    manager_id: '',
    user_ids: ''
  })
  
  useEffect(() => {
    if (project && open) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: new Date(project.start_date).toISOString().split('T')[0],
        end_date: new Date(project.end_date).toISOString().split('T')[0],
        manager_id: project.manager_id.toString(),
        user_ids: project.user_ids || ''
      })
    } else if (open) {
      setFormData({
        name: '',
        description: '',
        status: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        manager_id: '',
        user_ids: ''
      })
    }
  }, [project, open])

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        manager_id: parseInt(data.manager_id) || 0,
        status: parseInt(data.status.toString()) || 1
      }
      return project 
        ? updateProject(project.id, payload)
        : createProject(payload)
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(project ? 'Project updated successfully' : 'Project created successfully')
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        onOpenChange(false)
      } else {
        toast.error(res.error || 'Failed to save project')
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.manager_id) {
      toast.error('Name and Project Manager are required')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            <DialogDescription>
              {project ? 'Update the details for this project.' : 'Fill out the details below to create a new project.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Website Redesign"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the project"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input 
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">End Date</label>
                <Input 
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Project Manager</label>
              <Select value={formData.manager_id} onValueChange={v => setFormData({...formData, manager_id: v})} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a PM" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.firstname} {u.lastname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status.toString()} onValueChange={v => setFormData({...formData, status: parseInt(v)})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Pending / On Hold</SelectItem>
                  <SelectItem value="2">Active / In Progress</SelectItem>
                  <SelectItem value="5">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
             <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Members (User IDs)</label>
              <Input 
                value={formData.user_ids}
                onChange={e => setFormData({...formData, user_ids: e.target.value})}
                placeholder="e.g. 19,44,55"
              />
              <p className="text-xs text-muted-foreground">Comma-separated user IDs for now.</p>
            </div>
            
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {project ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
