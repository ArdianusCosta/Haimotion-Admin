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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, updateProject } from '@/app/actions/projects'
import { toast } from 'sonner'
import { Loader2, Check, Search } from 'lucide-react'

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
    status: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    manager_id: '',
    user_ids: [] as number[]
  })
  
  const [memberSearch, setMemberSearch] = useState('')
  
  useEffect(() => {
    if (project && open) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: new Date(project.start_date).toISOString().split('T')[0],
        end_date: new Date(project.end_date).toISOString().split('T')[0],
        manager_id: project.manager_id.toString(),
        user_ids: project.members ? project.members.map((m: any) => m.id) : []
      })
    } else if (open) {
      setFormData({
        name: '',
        description: '',
        status: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        manager_id: '',
        user_ids: []
      })
    }
  }, [project, open])

  const toggleMember = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId)
        ? prev.user_ids.filter(id => id !== userId)
        : [...prev.user_ids, userId]
    }))
  }

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        manager_id: parseInt(data.manager_id) || 0,
        status: parseInt(data.status.toString()) || 1,
        user_ids: data.user_ids
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
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
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
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status.toString()}
                onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="0">On Hold</option>
                <option value="1">Pending</option>
                <option value="2">Active / In Progress</option>
                <option value="5">Completed</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Project Manager</label>
              <select
                value={formData.manager_id}
                onChange={e => setFormData({...formData, manager_id: e.target.value})}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">-- Select a PM --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id.toString()}>{u.firstname} {u.lastname}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Team Members
                {formData.user_ids.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {formData.user_ids.length} selected
                  </span>
                )}
              </label>
              
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              
              <div className="max-h-[180px] overflow-y-auto rounded-md border border-input">
                {(() => {
                  const filteredUsers = users.filter(u => 
                    (u.firstname + ' ' + u.lastname).toLowerCase().includes(memberSearch.toLowerCase())
                  );
                  if (filteredUsers.length === 0) {
                    return <p className="p-3 text-sm text-muted-foreground">No users found</p>
                  }
                  return filteredUsers.map(u => {
                    const isSelected = formData.user_ids.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleMember(u.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {u.firstname?.charAt(0)}{u.lastname?.charAt(0)}
                        </div>
                        <span className="flex-1 text-left">{u.firstname} {u.lastname}</span>
                        <span className={`flex size-4 items-center justify-center rounded border transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                          {isSelected && <Check className="size-3" />}
                        </span>
                      </button>
                    )
                  })
                })()}
              </div>
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
