'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmLeads, createCrmLead, deleteCrmLead, updateCrmLeadStage, convertCrmLead } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Mail, Phone, Target, GitPullRequest, UserCheck, Sparkles, Filter } from 'lucide-react'
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

const stageColors: Record<string, string> = {
  'New Lead': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  'Contacted': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'Qualified': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Proposal': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Lost': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
}

const statusColors: Record<string, string> = {
  'New': 'bg-sky-500/10 text-sky-600 border border-sky-500/20',
  'In Progress': 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
  'Converted': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  'Lost': 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
}

export function CrmLeadsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<{ id: number; name: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    source: '',
    industry: '',
    status: 'New',
    pipeline_stage: 'New Lead',
    estimated_value: ''
  })

  const { data: leads, isLoading } = useQuery({
    queryKey: ['crmLeads'],
    queryFn: async () => {
      const res = await getCrmLeads()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: createCrmLead,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead created successfully')
        setIsCreateOpen(false)
        setFormData({ name: '', company: '', email: '', phone: '', whatsapp: '', source: '', industry: '', status: 'New', pipeline_stage: 'New Lead', estimated_value: '' })
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
      } else {
        toast.error(res.error || 'Failed to create lead')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrmLead,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
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
      } else toast.error(res.error || 'Failed to convert lead')
    }
  })

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, status }: { id: number, stage: string, status?: string }) => updateCrmLeadStage(id, stage, status),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Lead updated successfully')
        queryClient.invalidateQueries({ queryKey: ['crmLeads'] })
      } else {
        toast.error(res.error || 'Failed to update lead')
      }
    }
  })

  const filteredLeads = leads?.filter((lead: any) =>
    lead.name.toLowerCase().includes(search.toLowerCase()) ||
    (lead.company && lead.company.toLowerCase().includes(search.toLowerCase())) ||
    (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Name is required')
    createMutation.mutate(formData)
  }

  const totalValue = leads?.reduce((sum: number, l: any) => sum + (l.estimated_value || 0), 0) || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your potential customers.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: leads?.length || 0, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Active', value: leads?.filter((l: any) => l.status === 'In Progress').length || 0, color: 'text-violet-500', bg: 'bg-violet-500/10' },
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9 bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 border-border/50 shadow-sm">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="font-semibold text-foreground/70 pl-6">Lead Info</TableHead>
              <TableHead className="font-semibold text-foreground/70">Company</TableHead>
              <TableHead className="font-semibold text-foreground/70">Stage</TableHead>
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
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{lead.name}</span>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {lead.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                          {lead.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{lead.company || <span className="text-muted-foreground">—</span>}</span>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {lead.status !== 'Converted' && (
                          <DropdownMenuItem
                            onClick={() => convertMutation.mutate(lead.id)}
                            className="font-medium text-primary focus:text-primary focus:bg-primary/10"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Convert to Client & Deal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => updateStageMutation.mutate({ id: lead.id, stage: 'Qualified', status: 'In Progress' })}>
                          <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
                          Mark as Qualified
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStageMutation.mutate({ id: lead.id, stage: 'Lost', status: 'Lost' })}>
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
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add New Lead</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Fill in the details for your new lead.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</Label>
                <Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Acme Corp" />
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
                <Select value={formData.source} onValueChange={v => setFormData({ ...formData, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estimated Value (IDR)</Label>
                <Input type="number" value={formData.estimated_value} onChange={e => setFormData({ ...formData, estimated_value: e.target.value })} placeholder="50000000" />
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
