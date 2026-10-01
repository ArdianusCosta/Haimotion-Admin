'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmDeals, updateCrmDealStage, createCrmDeal } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

export function CrmPipelinePage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    stage: 'New',
    value: '',
  })

  const { data: deals, isLoading } = useQuery({
    queryKey: ['crmDeals'],
    queryFn: async () => {
      const res = await getCrmDeals()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number, stage: string }) => updateCrmDealStage(id, stage),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
      } else {
        toast.error(res.error || 'Failed to update deal')
      }
    }
  })

  const createMutation = useMutation({
    mutationFn: createCrmDeal,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Deal created successfully')
        setIsCreateOpen(false)
        setFormData({ title: '', stage: 'New', value: '' })
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
      } else {
        toast.error(res.error || 'Failed to create deal')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return toast.error('Title is required')
    createMutation.mutate(formData)
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedDealId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (draggedDealId !== null) {
      // Optimistic update
      const deal = deals.find((d: any) => d.id === draggedDealId)
      if (deal && deal.stage !== targetStage) {
        updateStageMutation.mutate({ id: draggedDealId, stage: targetStage })
      }
      setDraggedDealId(null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Deal
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-max items-start">
          {STAGES.map(stage => {
            const stageDeals = deals?.filter((d: any) => d.stage === stage) || []
            const stageTotal = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)

            return (
              <div 
                key={stage} 
                className="w-80 bg-muted/50 rounded-xl border flex flex-col flex-shrink-0 h-full max-h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="p-3 border-b flex items-center justify-between bg-card rounded-t-xl shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{stage}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stageTotal)}
                  </span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {isLoading ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : stageDeals.map((deal: any) => (
                    <div 
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className="bg-card p-3 rounded-lg border shadow-sm cursor-grab hover:border-primary/50 transition-colors active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">{deal.title}</h4>
                        <Button variant="ghost" className="h-6 w-6 p-0 -mr-1 -mt-1 shrink-0 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {deal.client && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {deal.client.company_name}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-semibold text-primary">
                          {deal.value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(deal.value) : '-'}
                        </span>
                        
                        {deal.assigned_user && (
                          <div className="h-5 w-5 rounded-full bg-accent text-accent-foreground text-[9px] flex items-center justify-center font-bold" title={deal.assigned_user.firstname}>
                            {deal.assigned_user.firstname?.[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Website Redesign"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select 
                  value={formData.stage} 
                  onValueChange={v => setFormData({...formData, stage: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Value (IDR)</Label>
                <Input 
                  type="number"
                  value={formData.value} 
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  placeholder="10000000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Deal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
