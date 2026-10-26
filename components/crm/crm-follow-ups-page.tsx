'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCrmFollowUps,
  createCrmFollowUp,
  updateCrmFollowUp,
  updateCrmFollowUpStatus,
  deleteCrmFollowUp,
  getCrmClients,
  getCrmLeads,
  getCrmDeals,
  getCrmUsers
} from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Calendar, Phone, Mail, CheckCircle2, Clock, AlertTriangle, MessageCircle, Edit } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const isPast = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

const TYPES = ['WhatsApp', 'Phone Call', 'Email', 'Meeting', 'Proposal', 'Other']

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'WhatsApp': { icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  'Phone Call': { icon: Phone, color: 'text-sky-600', bg: 'bg-sky-500/10' },
  'Email': { icon: Mail, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  'Meeting': { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500/10' },
  'Proposal': { icon: MoreHorizontal, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  'Other': { icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-500/10' },
}

const STATUS_CONFIG: Record<string, string> = {
  'Pending': 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  'Cancelled': 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
}

const FILTERS = ['All', 'Today', 'Pending', 'Overdue', 'Completed']

export function CrmFollowUpsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'WhatsApp',
    due_date: new Date().toISOString().split('T')[0],
    notes: '',
    client_id: '',
    lead_id: '',
    deal_id: '',
    assigned_user_id: ''
  })

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: 0,
    type: 'WhatsApp',
    due_date: '',
    notes: '',
    status: 'Pending',
    client_id: '',
    lead_id: '',
    deal_id: '',
    assigned_user_id: ''
  })

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null)

  // Queries
  const { data: followUps, isLoading } = useQuery({
    queryKey: ['crmFollowUps'],
    queryFn: async () => {
      const res = await getCrmFollowUps()
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

  const { data: deals } = useQuery({
    queryKey: ['crmDeals'],
    queryFn: async () => {
      const res = await getCrmDeals()
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
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateCrmFollowUpStatus(id, status),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Follow-up marked as ${res.data.status}`)
        queryClient.invalidateQueries({ queryKey: ['crmFollowUps'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    }
  })

  const createMutation = useMutation({
    mutationFn: createCrmFollowUp,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Follow-up scheduled successfully')
        setIsCreateOpen(false)
        setFormData({ type: 'WhatsApp', due_date: new Date().toISOString().split('T')[0], notes: '', client_id: '', lead_id: '', deal_id: '', assigned_user_id: '' })
        queryClient.invalidateQueries({ queryKey: ['crmFollowUps'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to schedule follow-up')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCrmFollowUp(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Follow-up updated successfully')
        setIsEditOpen(false)
        queryClient.invalidateQueries({ queryKey: ['crmFollowUps'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to update follow-up')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrmFollowUp,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Follow-up deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['crmFollowUps'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to delete follow-up')
      }
    }
  })

  const filteredData = followUps?.filter((item: any) => {
    const matchesSearch =
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(search.toLowerCase())) ||
      (item.client?.company_name && item.client.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.lead?.name && item.lead.name.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'Today') return matchesSearch && isToday(new Date(item.due_date)) && item.status !== 'Completed'
    if (filter === 'Overdue') return matchesSearch && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date)) && item.status !== 'Completed'
    if (filter === 'Completed') return matchesSearch && item.status === 'Completed'
    if (filter === 'Pending') return matchesSearch && item.status === 'Pending'
    return matchesSearch
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.due_date) return toast.error('Due date is required')
    createMutation.mutate(formData)
  }

  const handleOpenEdit = (item: any) => {
    setEditFormData({
      id: item.id,
      type: item.type || 'WhatsApp',
      due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
      notes: item.notes || '',
      status: item.status || 'Pending',
      client_id: item.client_id ? String(item.client_id) : '',
      lead_id: item.lead_id ? String(item.lead_id) : '',
      deal_id: item.deal_id ? String(item.deal_id) : '',
      assigned_user_id: item.assigned_user_id ? String(item.assigned_user_id) : ''
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.due_date) return toast.error('Due date is required')
    updateMutation.mutate({ id: editFormData.id, data: editFormData })
  }

  const todayCount = followUps?.filter((f: any) => isToday(new Date(f.due_date)) && f.status !== 'Completed').length || 0
  const overdueCount = followUps?.filter((f: any) => isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date)) && f.status !== 'Completed').length || 0
  const completedCount = followUps?.filter((f: any) => f.status === 'Completed').length || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow Ups</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and track all customer touchpoints and upcoming tasks.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4" /> Schedule Follow Up
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: followUps?.length || 0, color: 'text-violet-500', bg: 'bg-violet-500/10', icon: Calendar },
          { label: 'Due Today', value: todayCount, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
          { label: 'Overdue', value: overdueCount, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle },
          { label: 'Completed', value: completedCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter(item.label === 'Total' ? 'All' : item.label === 'Due Today' ? 'Today' : item.label)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8 mt-0.5" /> : item.value}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search follow-ups..."
            className="pl-9 bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1 shadow-sm">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="font-semibold text-foreground/70 pl-6">Type</TableHead>
              <TableHead className="font-semibold text-foreground/70">Due Date</TableHead>
              <TableHead className="font-semibold text-foreground/70">Related To</TableHead>
              <TableHead className="font-semibold text-foreground/70">Notes</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="font-semibold text-foreground/70 pr-6 w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-8 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[110px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium">No follow-ups found</p>
                      <p className="text-sm text-muted-foreground">Schedule your first touchpoint to stay on track.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((item: any) => {
                const isOverdue = item.status !== 'Completed' && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date))
                const isDueToday = item.status !== 'Completed' && isToday(new Date(item.due_date))
                const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG['Other']
                const TypeIcon = typeConf.icon

                return (
                  <TableRow key={item.id} className="group hover:bg-muted/20 transition-colors border-b border-border/40">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg ${typeConf.bg} flex items-center justify-center shrink-0`}>
                          <TypeIcon className={`h-4 w-4 ${typeConf.color}`} />
                        </div>
                        <span className="font-semibold text-sm">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        'flex items-center gap-1.5 text-sm',
                        isOverdue ? 'text-rose-600 font-semibold' : isDueToday ? 'text-amber-600 font-semibold' : 'text-muted-foreground'
                      )}>
                        {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : isDueToday ? <Clock className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                        {formatDate(new Date(item.due_date))}
                        {isOverdue && (
                          <span className="ml-1 text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 px-1.5 py-0.5 rounded-full">OVERDUE</span>
                        )}
                        {isDueToday && (
                          <span className="ml-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-full">TODAY</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        {item.client && <span className="font-semibold text-violet-600">🏢 {item.client.company_name}</span>}
                        {item.lead && <span className="font-medium text-sky-600">🎯 {item.lead.name}</span>}
                        {item.deal && <span className="text-muted-foreground">💼 {item.deal.title}</span>}
                        {!item.client && !item.lead && !item.deal && <span className="text-muted-foreground italic">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-muted-foreground truncate block" title={item.notes}>{item.notes || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[item.status] || 'bg-muted text-muted-foreground'}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {item.status !== 'Completed' && (
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'Completed' })} className="cursor-pointer">
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleOpenEdit(item)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4 text-violet-500" />
                            Edit Follow-Up
                          </DropdownMenuItem>
                          {item.status !== 'Cancelled' && (
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'Cancelled' })} className="cursor-pointer">
                              Cancel Follow-up
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => {
                              const title = item.notes || item.type || 'tindak lanjut'
                              setItemToDelete({ id: item.id, name: title })
                              setDeleteModalOpen(true)
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Schedule Follow Up</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Plan your next touchpoint with a client, lead, or deal.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date *</Label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attach to Client</Label>
              <Select value={formData.client_id} onValueChange={v => setFormData({ ...formData, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Or Attach to Lead</Label>
                <Select value={formData.lead_id} onValueChange={v => setFormData({ ...formData, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select lead (optional)" /></SelectTrigger>
                  <SelectContent>
                    {leads?.map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Or Attach to Deal</Label>
                <Select value={formData.deal_id} onValueChange={v => setFormData({ ...formData, deal_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select deal (optional)" /></SelectTrigger>
                  <SelectContent>
                    {deals?.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes / Description</Label>
              <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. Call to discuss proposal revision" />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? 'Scheduling...' : (<><Calendar className="h-4 w-4" /> Schedule</>)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit Follow Up</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Modify date, status, or related account.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type *</Label>
                <Select value={editFormData.type} onValueChange={v => setEditFormData({ ...editFormData, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date *</Label>
                <Input type="date" value={editFormData.due_date} onChange={e => setEditFormData({ ...editFormData, due_date: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select value={editFormData.status} onValueChange={v => setEditFormData({ ...editFormData, status: v })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attach Client</Label>
              <Select value={editFormData.client_id} onValueChange={v => setEditFormData({ ...editFormData, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</Label>
              <Input value={editFormData.notes} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} />
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

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteMutation.mutateAsync(itemToDelete.id)
            setItemToDelete(null)
          }
        }}
        title={`Hapus Tindak Lanjut ${itemToDelete ? `"${itemToDelete.name}"` : ''}`}
        description="Apakah Anda yakin ingin menghapus jadwal tindak lanjut ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
