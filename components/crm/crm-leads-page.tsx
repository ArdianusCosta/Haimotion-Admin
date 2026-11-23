'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCrmLeads,
  createCrmLead,
  updateCrmLead,
  deleteCrmLead,
  updateCrmLeadStage,
  convertCrmLead,
  getCrmLeadById,
  getCrmUsers,
  createCrmNote
} from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Mail, Phone, Target, GitPullRequest, UserCheck, Sparkles, Filter, Edit, Eye, MessageSquare, Building, FileText, Send, X, DollarSign, ExternalLink, User } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

const statusColors: Record<string, string> = {
  'New': 'bg-sky-500/10 text-sky-600 border border-sky-500/20',
  'In Progress': 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
  'Converted': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  'Lost': 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
}

const SOURCES = ['Website', 'WhatsApp', 'Instagram', 'Referral', 'LinkedIn', 'Cold Call', 'Other']

export function CrmLeadsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Create Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    source: 'Website',
    industry: '',
    status: 'New',
    pipeline_stage: 'New Lead',
    estimated_value: '',
    assigned_user_id: ''
  })

  // Edit Dialog
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [leadToEdit, setLeadToEdit] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    id: 0,
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    source: 'Website',
    industry: '',
    status: 'New',
    pipeline_stage: 'New Lead',
    estimated_value: '',
    assigned_user_id: ''
  })

  // View Details Drawer
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')

  // Delete Dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<{ id: number; name: string } | null>(null)

  // Fetch Leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ['crmLeads'],
    queryFn: async () => {
      const res = await getCrmLeads()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  // Fetch Users for Assigned Selector
  const { data: users } = useQuery({
    queryKey: ['crmUsers'],
    queryFn: async () => {
      const res = await getCrmUsers()
      if (!res.success) return []
      return res.data || []
    }
  })

  // Fetch Selected Lead Details
  const { data: leadDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['crmLeadDetails', selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return null
      const res = await getCrmLeadById(selectedLeadId)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    enabled: !!selectedLeadId
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrmLead,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead created successfully')
        setIsCreateOpen(false)
        setFormData({ name: '', company: '', email: '', phone: '', whatsapp: '', source: 'Website', industry: '', status: 'New', pipeline_stage: 'New Lead', estimated_value: '', assigned_user_id: '' })
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to create lead')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCrmLead(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead updated successfully')
        setIsEditOpen(false)
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
        queryClient.invalidateQueries({ queryKey: ['crmLeadDetails', selectedLeadId] })
      } else {
        toast.error(res.error || 'Failed to update lead')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrmLead,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead deleted successfully')
        if (selectedLeadId === leadToDelete?.id) setSelectedLeadId(null)
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to delete lead')
      }
    }
  })

  const convertMutation = useMutation({
    mutationFn: convertCrmLead,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead successfully converted to Client & Deal!')
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
        queryClient.invalidateQueries({ queryKey: ['crmDeals'] })
        queryClient.invalidateQueries({ queryKey: ['crmClients'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
        if (selectedLeadId) queryClient.invalidateQueries({ queryKey: ['crmLeadDetails', selectedLeadId] })
      } else {
        toast.error(res.error || 'Failed to convert lead')
      }
    }
  })

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, status }: { id: number, stage: string, status?: string }) => updateCrmLeadStage(id, stage, status),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead stage updated successfully')
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
        if (selectedLeadId) queryClient.invalidateQueries({ queryKey: ['crmLeadDetails', selectedLeadId] })
      } else {
        toast.error(res.error || 'Failed to update lead')
      }
    }
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => createCrmNote({ content, lead_id: selectedLeadId! }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Note added')
        setNewNoteContent('')
        queryClient.invalidateQueries({ queryKey: ['crmLeadDetails', selectedLeadId] })
      } else {
        toast.error(res.error || 'Failed to add note')
      }
    }
  })

  // Filtering
  const filteredLeads = leads?.filter((lead: any) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(search.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone && lead.phone.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return toast.error('Lead name is required')
    createMutation.mutate(formData)
  }

  const handleOpenEdit = (lead: any) => {
    setLeadToEdit(lead)
    setEditFormData({
      id: lead.id,
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || '',
      source: lead.source || 'Website',
      industry: lead.industry || '',
      status: lead.status || 'New',
      pipeline_stage: lead.pipeline_stage || 'New Lead',
      estimated_value: lead.estimated_value ? String(lead.estimated_value) : '',
      assigned_user_id: lead.assigned_user_id ? String(lead.assigned_user_id) : ''
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.name.trim()) return toast.error('Lead name is required')
    updateMutation.mutate({ id: editFormData.id, data: editFormData })
  }

  const totalValue = leads?.reduce((sum: number, l: any) => sum + (l.estimated_value || 0), 0) || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, qualify, and convert your potential customers.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: leads?.length || 0, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Active', value: leads?.filter((l: any) => l.status === 'In Progress' || l.status === 'New').length || 0, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Converted', value: leads?.filter((l: any) => l.status === 'Converted').length || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Value', value: `Rp ${(totalValue / 1000000).toFixed(1)}M`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`text-xs font-medium ${item.color} mb-1`}>{item.label}</div>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, company, email..."
            className="pl-9 bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-card border border-border/50 p-1 rounded-xl shadow-sm">
          {['All', 'New', 'In Progress', 'Converted', 'Lost'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${statusFilter === st ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="font-semibold text-foreground/70 pl-6">Lead Info</TableHead>
              <TableHead className="font-semibold text-foreground/70">Company</TableHead>
              <TableHead className="font-semibold text-foreground/70">Stage & Status</TableHead>
              <TableHead className="font-semibold text-foreground/70">Value</TableHead>
              <TableHead className="font-semibold text-foreground/70">Assigned To</TableHead>
              <TableHead className="font-semibold text-foreground/70 pr-6 w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-10 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                      <Target className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium">No leads found</p>
                      <p className="text-sm text-muted-foreground">Add your first lead to get started.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads?.map((lead: any) => (
                <TableRow key={lead.id} className="group hover:bg-muted/20 transition-colors border-b border-border/40">
                  <TableCell className="pl-6 py-4 cursor-pointer" onClick={() => setSelectedLeadId(lead.id)}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm hover:underline">{lead.name}</span>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {lead.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                          {lead.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{lead.company || <span className="text-muted-foreground italic">Individual</span>}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[lead.status] || 'bg-muted text-muted-foreground border-border'}`}>
                        {lead.status}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3" /> {lead.pipeline_stage}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-emerald-600">
                      {lead.estimated_value
                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(lead.estimated_value)
                        : <span className="text-muted-foreground font-normal">—</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 ring-2 ring-offset-1 ring-primary/20">
                          <AvatarImage src={lead.assigned_user.avatar || undefined} />
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10">{lead.assigned_user.firstname?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{lead.assigned_user.firstname}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => setSelectedLeadId(lead.id)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4 text-sky-500" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(lead)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4 text-violet-500" /> Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {lead.status !== 'Converted' && (
                          <DropdownMenuItem
                            onClick={() => convertMutation.mutate(lead.id)}
                            className="font-medium text-primary focus:text-primary focus:bg-primary/10 cursor-pointer"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Convert to Client & Deal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => updateStageMutation.mutate({ id: lead.id, stage: 'Qualified', status: 'In Progress' })} className="cursor-pointer">
                          <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
                          Mark as Qualified
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStageMutation.mutate({ id: lead.id, stage: 'Lost', status: 'Lost' })} className="cursor-pointer">
                          Mark as Lost
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => {
                            setLeadToDelete({ id: lead.id, name: lead.name })
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add New Lead</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Fill in the prospect information below.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</Label>
                <Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Acme Corp (optional)" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone / WhatsApp</Label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })} placeholder="+62..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</Label>
                <Select value={formData.source || ''} onValueChange={v => setFormData({ ...formData, source: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Value (IDR)</Label>
                <Input type="number" value={formData.estimated_value} onChange={e => setFormData({ ...formData, estimated_value: e.target.value })} placeholder="50000000" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Sales / PIC</Label>
                <Select value={formData.assigned_user_id || ''} onValueChange={v => setFormData({ ...formData, assigned_user_id: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>
                    {users?.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.firstname} {u.lastname} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? 'Saving...' : (<><Plus className="h-4 w-4" /> Save Lead</>)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit Lead</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Update lead details and assignments.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</Label>
                <Input value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</Label>
                <Input value={editFormData.company} onChange={e => setEditFormData({ ...editFormData, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                <Input type="email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone / WhatsApp</Label>
                <Input value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value, whatsapp: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                <Select value={editFormData.status || ''} onValueChange={v => setEditFormData({ ...editFormData, status: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Value (IDR)</Label>
                <Input type="number" value={editFormData.estimated_value} onChange={e => setEditFormData({ ...editFormData, estimated_value: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Sales / PIC</Label>
                <Select value={editFormData.assigned_user_id || ''} onValueChange={v => setEditFormData({ ...editFormData, assigned_user_id: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>
                    {users?.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.firstname} {u.lastname} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

      {/* View Details Drawer */}
      <Sheet open={!!selectedLeadId} onOpenChange={(open) => !open && setSelectedLeadId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[540px] p-0 overflow-hidden flex flex-col border-l border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
          {isLoadingDetails ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : leadDetails ? (
            <>
              {/* Header */}
              <div className="p-6 pb-4 bg-muted/20 border-b border-border/50">
                <SheetHeader>
                  <div className="flex items-start gap-3.5 pr-6">
                    <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-primary/15 to-violet-500/20 border border-primary/25 text-primary font-bold text-lg shadow-inner shrink-0">
                      {leadDetails.name[0]?.toUpperCase() || 'L'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                        {leadDetails.name}
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Detail prospek {leadDetails.name}
                      </SheetDescription>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[11px] font-medium bg-muted/40 text-foreground/80 border-border/60 gap-1 px-2 py-0.5">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {leadDetails.company || 'Individual Prospect'}
                        </Badge>
                        {leadDetails.source && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            via <span className="font-medium text-foreground/80">{leadDetails.source}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Bar & Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[leadDetails.status] || 'bg-muted text-muted-foreground'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {leadDetails.status}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border border-border/40 px-2.5 py-1 rounded-full">
                        <GitPullRequest className="h-3 w-3 text-primary" /> {leadDetails.pipeline_stage}
                      </span>
                    </div>

                    {leadDetails.status !== 'Converted' ? (
                      <Button
                        size="sm"
                        className="text-xs font-semibold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-all shadow-emerald-500/20"
                        onClick={() => convertMutation.mutate(leadDetails.id)}
                        disabled={convertMutation.isPending}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {convertMutation.isPending ? 'Converting...' : 'Convert to Deal'}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1.5 py-1">
                        <UserCheck className="h-3.5 w-3.5" /> Converted to Client
                      </Badge>
                    )}
                  </div>
                </SheetHeader>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Contact Info Card */}
                <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        Email
                      </span>
                      {leadDetails.email ? (
                        <a href={`mailto:${leadDetails.email}`} className="font-medium text-foreground hover:text-sky-400 transition-colors flex items-center gap-1 truncate max-w-[240px]">
                          <span className="truncate">{leadDetails.email}</span>
                          <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        WhatsApp / Telp
                      </span>
                      {leadDetails.phone || leadDetails.whatsapp ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{leadDetails.whatsapp || leadDetails.phone}</span>
                          {leadDetails.whatsapp && (
                            <a
                              href={`https://wa.me/${leadDetails.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 font-semibold"
                            >
                              Chat WA
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/30">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <DollarSign className="h-3.5 w-3.5" />
                        </div>
                        Est. Value
                      </span>
                      <span className="font-bold text-sm text-emerald-400 font-mono">
                        {leadDetails.estimated_value ? `Rp ${leadDetails.estimated_value.toLocaleString('id-ID')}` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        Assigned To
                      </span>
                      {leadDetails.assigned_user ? (
                        <div className="flex items-center gap-2 bg-muted/40 px-2.5 py-1 rounded-full border border-border/50">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={leadDetails.assigned_user.avatar || ''} />
                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                              {leadDetails.assigned_user.firstname[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground text-xs">
                            {leadDetails.assigned_user.firstname} {leadDetails.assigned_user.lastname}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Related Deals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <GitPullRequest className="h-3.5 w-3.5 text-primary" /> Related Deals
                    </h4>
                    <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {leadDetails.deals?.length || 0}
                    </Badge>
                  </div>
                  {(!leadDetails.deals || leadDetails.deals.length === 0) ? (
                    <div className="p-5 rounded-xl border border-dashed border-border/60 bg-muted/10 text-center">
                      <p className="text-xs text-muted-foreground">Belum ada deal terhubung untuk prospek ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {leadDetails.deals.map((d: any) => (
                        <div key={d.id} className="p-3.5 rounded-xl border border-border/60 bg-card/60 hover:border-border transition-all text-xs flex justify-between items-center shadow-sm">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground text-sm">{d.title}</p>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground border-border/60 bg-muted/30">
                              Stage: {d.stage || d.pipeline_stage?.name || 'Prospect'}
                            </Badge>
                          </div>
                          <span className="font-bold text-sm text-emerald-400 font-mono">
                            {d.value ? `Rp ${Number(d.value).toLocaleString('id-ID')}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" /> Internal Notes
                    </h4>
                    <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {leadDetails.notes?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {(!leadDetails.notes || leadDetails.notes.length === 0) ? (
                      <div className="p-5 rounded-xl border border-dashed border-border/60 bg-muted/10 text-center">
                        <p className="text-xs text-muted-foreground">Belum ada catatan internal untuk prospek ini.</p>
                      </div>
                    ) : (
                      leadDetails.notes.map((n: any) => (
                        <div key={n.id} className="p-3 rounded-xl bg-card/70 border border-border/50 text-xs space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={n.author?.avatar || ''} />
                                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                  {n.author?.firstname?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-foreground text-[11px]">
                                {n.author ? `${n.author.firstname} ${n.author.lastname || ''}` : 'Staff'}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-foreground/90 pl-7 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Note Input Footer */}
              <div className="p-4 bg-background/90 border-t border-border/50">
                <div className="flex items-center gap-2 bg-muted/30 border border-border/60 rounded-xl px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <Input
                    placeholder="Tulis catatan internal... (Tekan Enter)"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="text-xs h-8 border-0 bg-transparent shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNoteContent.trim() && !addNoteMutation.isPending) {
                        e.preventDefault()
                        addNoteMutation.mutate(newNoteContent.trim())
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs gap-1.5 shadow-sm"
                    disabled={!newNoteContent.trim() || addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate(newNoteContent.trim())}
                  >
                    <Send className="h-3 w-3" />
                    <span>Kirim</span>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={async () => {
          if (leadToDelete) {
            await deleteMutation.mutateAsync(leadToDelete.id)
            setLeadToDelete(null)
          }
        }}
        title={`Hapus Prospek ${leadToDelete ? `"${leadToDelete.name}"` : ''}`}
        description="Apakah Anda yakin ingin menghapus data prospek ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
