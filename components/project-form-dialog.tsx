'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject, updateProject } from '@/app/actions/projects'
import { toast } from 'sonner'
import { Loader2, Check, Search, CalendarDays, Users, ShieldCheck, X } from 'lucide-react'

export const isUserActive = (u: any) => {
  if (!u) return false
  if (u.status && u.status.toLowerCase() === 'resign') return false
  if (u.firstname && u.firstname.toUpperCase().includes('[RESIGN]')) return false
  if (u.lastname && u.lastname.toUpperCase().includes('[RESIGN]')) return false
  if (u.name && u.name.toUpperCase().includes('[RESIGN]')) return false
  return true
}

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
  const activeUsers = useMemo(() => users.filter(isUserActive), [users])
  
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
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
        name: project.name || '',
        client_name: project.client_name || '',
        description: project.description || '',
        status: project.status !== undefined ? project.status : 1,
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        manager_id: project.manager_id ? project.manager_id.toString() : '',
        user_ids: project.members 
          ? project.members
              .map((m: any) => {
                if (!m) return null
                if (typeof m === 'number') return m
                if (m.user && !isUserActive(m.user)) return null
                if (m.user?.id) return Number(m.user.id)
                if (m.user_id) return Number(m.user_id)
                if (m.id) return Number(m.id)
                return null
              })
              .filter((id: any): id is number => typeof id === 'number' && !isNaN(id) && id > 0)
              .filter((id: number) => {
                const u = users.find(usr => Number(usr.id) === id)
                return u ? isUserActive(u) : true
              })
          : []
      })
    } else if (open) {
      setFormData({
        name: '',
        client_name: '',
        description: '',
        status: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        manager_id: '',
        user_ids: []
      })
    }
  }, [project, open, users])

  const toggleMember = (userId: number) => {
    const targetId = Number(userId)
    setFormData(prev => {
      const current = prev.user_ids.map(Number)
      return {
        ...prev,
        user_ids: current.includes(targetId)
          ? current.filter(id => id !== targetId)
          : [...current, targetId]
      }
    })
  }

  const selectedMembers = useMemo(() => {
    const idSet = new Set(formData.user_ids.map(Number))
    return activeUsers.filter(u => idSet.has(Number(u.id)))
  }, [formData.user_ids, activeUsers])

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        client_name: data.client_name.trim() || undefined,
        manager_id: parseInt(data.manager_id) || 0,
        status: parseInt(data.status.toString()) || 1,
        start_date: data.start_date,
        end_date: data.end_date,
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
        if (project) {
          queryClient.invalidateQueries({ queryKey: ['project-detail', project.id] })
        }
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
    if (!formData.name.trim() || !formData.manager_id) {
      toast.error('Project Name and Project Manager are required')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[740px] max-h-[92vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {project ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {project ? 'Update the details and team members for this project.' : 'Fill out the details below to initialize a new project.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Project Name & Client Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Website Redesign"
                  required
                  className="h-9.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Client / Company (Optional)</Label>
                <Input 
                  value={formData.client_name} 
                  onChange={e => setFormData({...formData, client_name: e.target.value})}
                  placeholder="e.g. Acme Studio"
                  className="h-9.5 text-sm"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea 
                rows={3}
                className="text-sm resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description and objectives of the project..."
              />
            </div>

            {/* Timeline: Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <span>Start Date</span>
                </Label>
                <Input 
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  required
                  className="h-9.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <span>End Date</span>
                </Label>
                <Input 
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({...formData, end_date: e.target.value})}
                  required
                  className="h-9.5 text-sm"
                />
              </div>
            </div>

            {/* Status & Project Manager */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <select
                  value={formData.status.toString()}
                  onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}
                  className="flex h-9.5 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  <option value="1">Pending</option>
                  <option value="2">Active / In Progress</option>
                  <option value="0">On Hold</option>
                  <option value="5">Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  <span>Project Manager</span> <span className="text-destructive">*</span>
                </Label>
                <select
                  value={formData.manager_id}
                  onChange={e => setFormData({...formData, manager_id: e.target.value})}
                  required
                  className="flex h-9.5 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">-- Select a PM --</option>
                  {activeUsers.map(u => (
                    <option key={u.id} value={u.id.toString()}>{u.firstname} {u.lastname || ''}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Team Members */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Users className="size-3.5 text-muted-foreground" />
                  <span>Team Members</span>
                </Label>
                {formData.user_ids.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {formData.user_ids.length} selected
                  </span>
                )}
              </div>

              {/* Selected chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 rounded-lg border bg-muted/20">
                  {selectedMembers.map(m => (
                    <span 
                      key={m.id} 
                      className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-xs text-foreground"
                    >
                      <span>{m.firstname}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleMember(m.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-8.5 pl-8 text-xs"
                />
              </div>
              
              <div className="max-h-[160px] overflow-y-auto rounded-lg border border-input divide-y divide-border/60">
                {(() => {
                  const filteredUsers = activeUsers.filter(u => 
                    (u.firstname + ' ' + (u.lastname || '')).toLowerCase().includes(memberSearch.toLowerCase()) ||
                    (u.email || '').toLowerCase().includes(memberSearch.toLowerCase())
                  );
                  if (filteredUsers.length === 0) {
                    return <p className="p-3 text-xs text-muted-foreground text-center">No users found</p>
                  }
                  return filteredUsers.map(u => {
                    const isSelected = formData.user_ids.map(Number).includes(Number(u.id))
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleMember(u.id)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-muted ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                            {u.firstname?.charAt(0)}{u.lastname?.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground truncate">{u.firstname} {u.lastname || ''}</span>
                        </div>
                        <span className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                          {isSelected && <Check className="size-3" />}
                        </span>
                      </button>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
