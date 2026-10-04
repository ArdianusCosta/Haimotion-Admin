import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjectMilestones, createProjectMilestone, updateProjectMilestoneStatus, deleteProjectMilestone } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, CheckCircle2, Clock, Trash2, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function ProjectMilestones({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', due_date: new Date().toISOString().split('T')[0] })

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['projectMilestones', projectId],
    queryFn: async () => {
      const res = await getProjectMilestones(projectId)
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: createProjectMilestone,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Milestone created')
        setIsOpen(false)
        setFormData({ title: '', description: '', due_date: new Date().toISOString().split('T')[0] })
        queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] })
      } else toast.error(res.error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateProjectMilestoneStatus(id, status, projectId),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] })
      else toast.error(res.error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProjectMilestone(id, projectId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Milestone deleted')
        queryClient.invalidateQueries({ queryKey: ['projectMilestones', projectId] })
      } else toast.error(res.error)
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.due_date) return toast.error('Title and due date required')
    createMutation.mutate({ project_id: projectId, ...formData })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Roadmap</p>
          <h2 className="text-lg font-semibold text-foreground">Project Milestones</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          <Plus className="size-4 mr-2" /> Add Milestone
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : milestones?.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No milestones defined for this project.
          </div>
        ) : (
          milestones?.map((m: any) => (
            <div key={m.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <button 
                  onClick={() => updateMutation.mutate({ id: m.id, status: m.status === 'Completed' ? 'Pending' : 'Completed' })}
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${m.status === 'Completed' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-transparent hover:border-primary'}`}
                >
                  <CheckCircle2 className="size-3" />
                </button>
                <div>
                  <h4 className={`text-sm font-medium ${m.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{m.title}</h4>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3" /> {new Date(m.due_date).toLocaleDateString()}</span>
                    {m.status === 'Pending' && <span className="flex items-center gap-1 text-amber-500"><Clock className="size-3" /> Pending</span>}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => {
                if(confirm('Delete milestone?')) deleteMutation.mutate(m.id)
              }}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Milestone Title</Label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
