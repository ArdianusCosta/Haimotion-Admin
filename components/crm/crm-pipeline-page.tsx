'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCrmDeals,
  updateCrmDealStage,
  createCrmDeal,
  updateCrmDeal,
  deleteCrmDeal,
  getCrmPipelines,
  getCrmClients,
  getCrmLeads,
  getCrmUsers
} from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal, DollarSign, TrendingUp, Layers, Edit, Trash, Eye, Calendar, User, Briefcase, Target } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

const STAGE_COLORS = [
  'from-sky-500/20 to-sky-600/10 border-sky-500/20',
  'from-violet-500/20 to-violet-600/10 border-violet-500/20',
  'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
  'from-rose-500/20 to-rose-600/10 border-rose-500/20',
  'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20',
]

const STAGE_DOT_COLORS = [
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-indigo-500',
]

const STAGE_BADGE_COLORS = [
  'text-sky-600 bg-sky-500/10',
  'text-violet-600 bg-violet-500/10',
  'text-amber-600 bg-amber-500/10',
  'text-emerald-600 bg-emerald-500/10',
  'text-rose-600 bg-rose-500/10',
  'text-indigo-600 bg-indigo-500/10',
]

export function CrmPipelinePage() {
  const queryClient = useQueryClient()
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null)

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    stage_id: '',
    value: '',
    client_id: '',
    lead_id: '',
    assigned_user_id: '',
    probability: '20',
    expected_close: ''
  })

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: 0,
    title: '',
    stage_id: '',
    value: '',
    client_id: '',
    lead_id: '',
    assigned_user_id: '',
    probability: '20',
    expected_close: ''
  })

  // View Details Modal
  const [selectedDealForView, setSelectedDealForView] = useState<any | null>(null)

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [dealToDelete, setDealToDelete] = useState<{ id: number; title: string } | null>(null)

  // Queries
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

  const { data: clients } = useQuery({
    queryKey: ['crmClients'],
    queryFn: async () => {
      const res = await getCrmClients()
      if (!res.success) return []
      return res.data || []
    }
  })

  const { data: leads } = useQuery({
    queryKey: ['crmLeads'],
    queryFn: async () => {
      const res = await getCrmLeads()
      if (!res.success) return []
      return res.data || []
    }
  })

  const { data: users } = useQuery({
    queryKey: ['crmUsers'],
    queryFn: async () => {
      const res = await getCrmUsers()
      if (!res.success) return []
      return res.data || []
    }
  })

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, pipeline_id, stage_id }: { id: number, stage: string, pipeline_id: number, stage_id: number }) =>
      updateCrmDealStage(id, stage, pipeline_id, stage_id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to update deal stage')
      }
    }
  })

  const createMutation = useMutation({
    mutationFn: createCrmDeal,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Deal created successfully')
        setIsCreateOpen(false)
        setFormData({ title: '', stage_id: '', value: '', client_id: '', lead_id: '', assigned_user_id: '', probability: '20', expected_close: '' })
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to create deal')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCrmDeal(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Deal updated successfully')
        setIsEditOpen(false)
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to update deal')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrmDeal,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Deal deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to delete deal')
      }
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return toast.error('Title is required')
    if (!activePipeline) return toast.error('No pipeline configured')

    const selectedStage = stages.find((s: any) => s.id.toString() === formData.stage_id) || stages[0]

    createMutation.mutate({
      ...formData,
      stage: selectedStage?.name || 'New',
      stage_id: selectedStage ? Number(selectedStage.id) : null,
      pipeline_id: activePipeline.id
    })
  }

  const handleOpenCreateWithStage = (stageId: string) => {
    setFormData(prev => ({ ...prev, stage_id: stageId }))
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (deal: any) => {
    setEditFormData({
      id: deal.id,
      title: deal.title || '',
      stage_id: deal.stage_id ? String(deal.stage_id) : '',
      value: deal.value ? String(deal.value) : '',
      client_id: deal.client_id ? String(deal.client_id) : '',
      lead_id: deal.lead_id ? String(deal.lead_id) : '',
      assigned_user_id: deal.assigned_user_id ? String(deal.assigned_user_id) : '',
      probability: deal.probability ? String(deal.probability) : '20',
      expected_close: deal.expected_close ? new Date(deal.expected_close).toISOString().split('T')[0] : ''
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.title.trim()) return toast.error('Title is required')
    const selectedStage = stages.find((s: any) => s.id.toString() === editFormData.stage_id)
    updateMutation.mutate({
      id: editFormData.id,
      data: {
        ...editFormData,
        stage: selectedStage ? selectedStage.name : undefined,
        pipeline_id: activePipeline?.id
      }
    })
  }

  // Drag & Drop
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
          <p className="text-muted-foreground text-sm mt-1">Manage and drag deals through your sales stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 text-emerald-600 rounded-xl px-4 py-2 border border-emerald-500/20">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalDealsValue)}
            </span>
            <span className="text-xs opacity-70">pipeline value</span>
          </div>
          <Button onClick={() => { setFormData(prev => ({ ...prev, stage_id: stages[0]?.id ? String(stages[0].id) : '' })); setIsCreateOpen(true); }} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
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

                {/* Cards Container */}
                <div className="p-3 pt-0 flex-1 overflow-y-auto space-y-3">
                  {isLoading ? (
                    <Skeleton className="h-28 w-full rounded-xl" />
                  ) : stageDeals.length === 0 ? (
                    <div className="h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                      <p className="text-xs">No deals here</p>
                      <p className="text-[11px] opacity-70">Drag deals here</p>
                    </div>
                  ) : (
                    stageDeals.map((deal: any) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className={`group bg-card rounded-xl border border-border/60 p-3.5 cursor-grab shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 active:cursor-grabbing active:scale-95 ${draggedDealId === deal.id ? 'opacity-40' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm line-clamp-2 leading-tight flex-1 mr-1">{deal.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 p-0 -mr-1 -mt-0.5 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setSelectedDealForView(deal)} className="cursor-pointer">
                                <Eye className="mr-2 h-3.5 w-3.5 text-sky-500" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(deal)} className="cursor-pointer">
                                <Edit className="mr-2 h-3.5 w-3.5 text-violet-500" /> Edit Deal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => {
                                  setDealToDelete({ id: deal.id, title: deal.title })
                                  setDeleteModalOpen(true)
                                }}
                              >
                                <Trash className="mr-2 h-3.5 w-3.5" /> Delete Deal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {deal.client && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Briefcase className="h-3 w-3 text-violet-500" />
                            <span className="text-xs text-muted-foreground truncate">{deal.client.company_name}</span>
                          </div>
                        )}
                        {deal.lead && !deal.client && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Target className="h-3 w-3 text-sky-500" />
                            <span className="text-xs text-muted-foreground truncate">{deal.lead.name}</span>
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
                              title={`${deal.assigned_user.firstname} ${deal.assigned_user.lastname || ''}`}
                            >
                              {deal.assigned_user.firstname?.[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Deal Button at bottom */}
                <div className="p-3 pt-0 shrink-0">
                  <button
                    onClick={() => handleOpenCreateWithStage(stage.id.toString())}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/70 transition-colors border border-dashed border-border/60 hover:border-border cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add New Deal</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Attach a sales opportunity to your pipeline.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Website Redesign Project" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value (IDR)</Label>
                <Input type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} placeholder="50000000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attach Client</Label>
                <Select value={formData.client_id} onValueChange={v => setFormData({ ...formData, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Or Attach Lead</Label>
                <Select value={formData.lead_id} onValueChange={v => setFormData({ ...formData, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                  <SelectContent>
                    {leads?.map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name} {l.company ? `(${l.company})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned PIC</Label>
                <Select value={formData.assigned_user_id} onValueChange={v => setFormData({ ...formData, assigned_user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {users?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.firstname} {u.lastname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected Close</Label>
                <Input type="date" value={formData.expected_close} onChange={e => setFormData({ ...formData, expected_close: e.target.value })} />
              </div>
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit Deal</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Update deal details and milestones.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Title *</Label>
              <Input value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage</Label>
                <Select value={editFormData.stage_id} onValueChange={v => setEditFormData({ ...editFormData, stage_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value (IDR)</Label>
                <Input type="number" value={editFormData.value} onChange={e => setEditFormData({ ...editFormData, value: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attach Client</Label>
                <Select value={editFormData.client_id} onValueChange={v => setEditFormData({ ...editFormData, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned PIC</Label>
                <Select value={editFormData.assigned_user_id} onValueChange={v => setEditFormData({ ...editFormData, assigned_user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {users?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.firstname} {u.lastname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected Close Date</Label>
              <Input type="date" value={editFormData.expected_close} onChange={e => setEditFormData({ ...editFormData, expected_close: e.target.value })} />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!selectedDealForView} onOpenChange={(open) => !open && setSelectedDealForView(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{selectedDealForView?.title}</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Stage: {selectedDealForView?.stage}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedDealForView && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Deal Value:</span>
                <span className="font-bold text-sm text-emerald-600">
                  {selectedDealForView.value
                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedDealForView.value)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Attached Client:</span>
                <span className="font-semibold">{selectedDealForView.client?.company_name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Attached Lead:</span>
                <span className="font-semibold">{selectedDealForView.lead?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Assigned Sales / PIC:</span>
                <span className="font-semibold">{selectedDealForView.assigned_user ? `${selectedDealForView.assigned_user.firstname} ${selectedDealForView.assigned_user.lastname || ''}` : 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Expected Close:</span>
                <span className="font-semibold">{selectedDealForView.expected_close ? new Date(selectedDealForView.expected_close).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDealForView(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={async () => {
          if (dealToDelete) {
            await deleteMutation.mutateAsync(dealToDelete.id)
            setDealToDelete(null)
          }
        }}
        title={`Hapus Peluang ${dealToDelete ? `"${dealToDelete.title}"` : ''}`}
        description="Apakah Anda yakin ingin menghapus data deal ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
