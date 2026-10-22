'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmDeals, updateCrmDealStage, createCrmDeal, getCrmPipelines } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal, DollarSign, TrendingUp, Layers, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const STAGE_COLORS = [
  'from-sky-500/20 to-sky-600/10 border-sky-500/20',
  'from-violet-500/20 to-violet-600/10 border-violet-500/20',
  'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
  'from-rose-500/20 to-rose-600/10 border-rose-500/20',
]

const STAGE_DOT_COLORS = [
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
]

const STAGE_BADGE_COLORS = [
  'text-sky-600 bg-sky-500/10',
  'text-violet-600 bg-violet-500/10',
  'text-amber-600 bg-amber-500/10',
  'text-emerald-600 bg-emerald-500/10',
  'text-rose-600 bg-rose-500/10',
]

export function CrmPipelinePage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    stage_id: '',
    value: '',
  })

  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ['crmPipelines'],
    queryFn: async () => {
      const res = await getCrmPipelines()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const activePipeline = pipelines?.[0]
  const stages = activePipeline?.stages || []

  const { data: deals, isLoading } = useQuery({
    queryKey: ['crmDeals'],
    queryFn: async () => {
      const res = await getCrmDeals()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, pipeline_id, stage_id }: { id: number, stage: string, pipeline_id: number, stage_id: number }) => updateCrmDealStage(id, stage, pipeline_id, stage_id),
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
        setFormData({ title: '', stage_id: '', value: '' })
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
    if (!activePipeline) return toast.error('No pipeline found')

    const selectedStage = stages.find((s: any) => s.id.toString() === formData.stage_id)
    if (!selectedStage) return toast.error('Stage is required')

    createMutation.mutate({
      ...formData,
      stage: selectedStage.name,
      stage_id: parseInt(formData.stage_id),
      pipeline_id: activePipeline.id
    })
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedDealId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id.toString())
  }

  const handleDragOver = (e: React.DragEvent, stageId: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStageId(null)
  }

  const handleDrop = (e: React.DragEvent, targetStageObj: any) => {
    e.preventDefault()
    setDragOverStageId(null)
    if (draggedDealId !== null && activePipeline) {
      const deal = deals?.find((d: any) => d.id === draggedDealId)
      if (deal && deal.stage_id !== targetStageObj.id) {
        updateStageMutation.mutate({
          id: draggedDealId,
          stage: targetStageObj.name,
          pipeline_id: activePipeline.id,
          stage_id: targetStageObj.id
        })
      }
      setDraggedDealId(null)
    }
  }

  const totalDealsValue = deals?.reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Drag & drop deals across stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 text-emerald-600 rounded-xl px-4 py-2 border border-emerald-500/20">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalDealsValue)}
            </span>
            <span className="text-xs opacity-70">total</span>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
            <Plus className="h-4 w-4" /> Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-max items-start">
          {isLoadingPipelines && (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-72 h-96 rounded-2xl shrink-0" />
            ))
          )}
          {stages.map((stage: any, idx: number) => {
            const stageDeals = deals?.filter((d: any) => d.stage_id === stage.id || d.stage === stage.name) || []
            const stageTotal = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
            const isDragOver = dragOverStageId === stage.id
            const colorIdx = idx % STAGE_COLORS.length

            return (
              <div
                key={stage.id}
                className={`w-72 rounded-2xl border bg-gradient-to-b ${STAGE_COLORS[colorIdx]} flex flex-col flex-shrink-0 h-full max-h-full transition-all duration-200 ${isDragOver ? 'scale-[1.02] shadow-xl ring-2 ring-primary/30' : 'shadow-sm'}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Column Header */}
                <div className="p-4 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${STAGE_DOT_COLORS[colorIdx]} shadow-sm`} />
                      <h3 className="font-bold text-sm">{stage.name}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STAGE_BADGE_COLORS[colorIdx]}`}>
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stageTotal)}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-3 pt-0 flex-1 overflow-y-auto space-y-3">
                  {isLoading ? (
                    <Skeleton className="h-28 w-full rounded-xl" />
                  ) : stageDeals.length === 0 ? (
                    <div className="h-20 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Drop here</p>
                    </div>
                  ) : (
                    stageDeals.map((deal: any) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className={`bg-card rounded-xl border border-border/60 p-3.5 cursor-grab shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 active:cursor-grabbing active:scale-95 ${draggedDealId === deal.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{deal.title}</h4>
                          <Button variant="ghost" className="h-6 w-6 p-0 -mr-1 -mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {deal.client && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <div className="h-5 w-5 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                              {deal.client.company_name?.[0]}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{deal.client.company_name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
                          <span className={`text-sm font-bold ${STAGE_BADGE_COLORS[colorIdx]?.split(' ')[0]}`}>
                            {deal.value
                              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(deal.value)
                              : '—'}
                          </span>
                          {deal.assigned_user && (
                            <div
                              className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/60 to-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm"
                              title={deal.assigned_user.firstname}
                            >
                              {deal.assigned_user.firstname?.[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add button at bottom */}
                <div className="p-3 pt-0 shrink-0">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors border border-dashed border-border/50 hover:border-border">
                    <Plus className="h-3.5 w-3.5" />
                    Add deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add New Deal</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Create a deal in your pipeline.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Website Redesign" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage</Label>
              <Select value={formData.stage_id} onValueChange={v => setFormData({ ...formData, stage_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Value (IDR)</Label>
              <Input type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="10000000" />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? 'Saving...' : (<><Plus className="h-4 w-4" /> Save Deal</>)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
