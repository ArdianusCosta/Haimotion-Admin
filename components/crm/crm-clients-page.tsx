'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCrmClients,
  createCrmClient,
  updateCrmClient,
  deleteCrmClient,
  getCrmClientById,
  getCrmUsers,
  createCrmNote
} from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Building, Briefcase, Globe, Filter, Users, Edit, Eye, Mail, Phone, Calendar, GitPullRequest, FileText, Send, MapPin } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  'Inactive': 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
  'Prospect': 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
}

function getInitials(name: string) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function getGradient(name: string) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ]
  const idx = (name?.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

export function CrmClientsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    address: '',
    city: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'Active',
    source: 'Website',
    assigned_user_id: ''
  })

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: 0,
    company_name: '',
    industry: '',
    website: '',
    address: '',
    city: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'Active',
    source: '',
    assigned_user_id: ''
  })

  // View Details Sheet
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')

  // Delete Dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null)

  // Fetch Clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['crmClients'],
    queryFn: async () => {
      const res = await getCrmClients()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  // Fetch Users
  const { data: users } = useQuery({
    queryKey: ['crmUsers'],
    queryFn: async () => {
      const res = await getCrmUsers()
      if (!res.success) return []
      return res.data || []
    }
  })

  // Fetch Single Client Details
  const { data: clientDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['crmClientDetails', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null
      const res = await getCrmClientById(selectedClientId)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    enabled: !!selectedClientId
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrmClient,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Client created successfully')
        setIsCreateOpen(false)
        setFormData({ company_name: '', industry: '', website: '', address: '', city: '', contact_name: '', contact_email: '', contact_phone: '', status: 'Active', source: 'Website', assigned_user_id: '' })
        queryClient.invalidateQueries({ queryKey: ['crmClients'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to create client')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCrmClient(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Client updated successfully')
        setIsEditOpen(false)
        queryClient.invalidateQueries({ queryKey: ['crmClients'] })
        queryClient.invalidateQueries({ queryKey: ['crmClientDetails', selectedClientId] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to update client')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrmClient,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Client deleted successfully')
        if (selectedClientId === clientToDelete?.id) setSelectedClientId(null)
        queryClient.invalidateQueries({ queryKey: ['crmClients'] })
        queryClient.invalidateQueries({ queryKey: ['crmStats'] })
      } else {
        toast.error(res.error || 'Failed to delete client')
      }
    }
  })

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => createCrmNote({ content, client_id: selectedClientId! }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Note added')
        setNewNoteContent('')
        queryClient.invalidateQueries({ queryKey: ['crmClientDetails', selectedClientId] })
      } else {
        toast.error(res.error || 'Failed to add note')
      }
    }
  })

  // Filter
  const filteredClients = clients?.filter((client: any) => {
    const matchesSearch =
      client.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (client.industry && client.industry.toLowerCase().includes(search.toLowerCase())) ||
      (client.city && client.city.toLowerCase().includes(search.toLowerCase())) ||
      (client.contacts?.[0]?.name && client.contacts[0].name.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'All' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.company_name.trim()) return toast.error('Company Name is required')
    createMutation.mutate(formData)
  }

  const handleOpenEdit = (client: any) => {
    const primaryContact = client.contacts?.find((c: any) => c.is_primary) || client.contacts?.[0]
    setEditFormData({
      id: client.id,
      company_name: client.company_name || '',
      industry: client.industry || '',
      website: client.website || '',
      address: client.address || '',
      city: client.city || '',
      contact_name: primaryContact?.name || '',
      contact_email: primaryContact?.email || '',
      contact_phone: primaryContact?.phone || '',
      status: client.status || 'Active',
      source: client.source || '',
      assigned_user_id: client.assigned_user_id ? String(client.assigned_user_id) : ''
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editFormData.company_name.trim()) return toast.error('Company Name is required')
    updateMutation.mutate({ id: editFormData.id, data: editFormData })
  }

  const activeCount = clients?.filter((c: any) => c.status === 'Active').length || 0
  const prospectCount = clients?.filter((c: any) => c.status === 'Prospect').length || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your customer accounts, contacts, and linked projects.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients', value: clients?.length || 0, color: 'text-violet-500', bg: 'bg-violet-500/10', icon: Users },
          { label: 'Active', value: activeCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Building },
          { label: 'Prospects', value: prospectCount, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Briefcase },
          { label: 'Total Deals', value: clients?.reduce((s: number, c: any) => s + (c.deals?.length || 0), 0) || 0, color: 'text-sky-500', bg: 'bg-sky-500/10', icon: Globe },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-10 mt-0.5" /> : item.value}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, industry, PIC..."
            className="pl-9 bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-card border border-border/50 p-1 rounded-xl shadow-sm">
          {['All', 'Active', 'Prospect', 'Inactive'].map((st) => (
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
              <TableHead className="font-semibold text-foreground/70 pl-6">Company / Client</TableHead>
              <TableHead className="font-semibold text-foreground/70">Primary Contact (PIC)</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="font-semibold text-foreground/70">Projects</TableHead>
              <TableHead className="font-semibold text-foreground/70">Deals</TableHead>
              <TableHead className="font-semibold text-foreground/70 pr-6 w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-10 w-[160px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[140px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredClients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium">No clients found</p>
                      <p className="text-sm text-muted-foreground">Add your first client to get started.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients?.map((client: any) => {
                const primaryPic = client.contacts?.find((c: any) => c.is_primary) || client.contacts?.[0]
                return (
                  <TableRow key={client.id} className="group hover:bg-muted/20 transition-colors border-b border-border/40">
                    <TableCell className="pl-6 py-4 cursor-pointer" onClick={() => setSelectedClientId(client.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(client.company_name)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                          {getInitials(client.company_name)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm hover:underline">{client.company_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            {client.industry && <span>{client.industry}</span>}
                            {client.city && <span>• {client.city}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {primaryPic ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-foreground">{primaryPic.name}</span>
                          <span className="text-muted-foreground">{primaryPic.email || primaryPic.phone || '—'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No contact added</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[client.status] || 'bg-muted text-muted-foreground'}`}>
                        {client.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-md bg-sky-500/10 flex items-center justify-center">
                          <Briefcase className="h-3 w-3 text-sky-500" />
                        </div>
                        <span className="font-semibold text-sm">{client.projects?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-emerald-600">{client.deals?.length || 0}</span>
                        <span className="text-xs text-muted-foreground">deals</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setSelectedClientId(client.id)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4 text-sky-500" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4 text-violet-500" /> Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => {
                              setClientToDelete({ id: client.id, name: client.company_name })
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
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add New Client</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Fill in the client organization and primary contact details.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Company Information
              </p>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company / Client Name *</Label>
                  <Input value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} placeholder="e.g. Acme Corp" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</Label>
                  <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. Creative, FinTech" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                  <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://acme.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City / Location</Label>
                  <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Jakarta Selatan" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Primary Contact (PIC)
              </p>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Name</Label>
                  <Input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="pic@example.com" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone / WhatsApp</Label>
                  <Input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+62812..." />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? 'Saving...' : (<><Plus className="h-4 w-4" /> Save Client</>)}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit Client</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Update client profile and primary PIC details.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name *</Label>
                <Input value={editFormData.company_name} onChange={e => setEditFormData({ ...editFormData, company_name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</Label>
                <Input value={editFormData.industry} onChange={e => setEditFormData({ ...editFormData, industry: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                <Input value={editFormData.website} onChange={e => setEditFormData({ ...editFormData, website: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                <Select value={editFormData.status} onValueChange={v => setEditFormData({ ...editFormData, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City</Label>
                <Input value={editFormData.city} onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIC Name</Label>
                <Input value={editFormData.contact_name} onChange={e => setEditFormData({ ...editFormData, contact_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIC Email</Label>
                <Input type="email" value={editFormData.contact_email} onChange={e => setEditFormData({ ...editFormData, contact_email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIC Phone</Label>
                <Input value={editFormData.contact_phone} onChange={e => setEditFormData({ ...editFormData, contact_phone: e.target.value })} />
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

      {/* View Details Sheet */}
      <Sheet open={!!selectedClientId} onOpenChange={(open) => !open && setSelectedClientId(null)}>
        <SheetContent className="sm:max-w-[540px] overflow-y-auto">
          {isLoadingDetails ? (
            <div className="space-y-4 pt-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : clientDetails ? (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${getGradient(clientDetails.company_name)} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                    {getInitials(clientDetails.company_name)}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold">{clientDetails.company_name}</SheetTitle>
                    <SheetDescription className="text-xs">
                      {clientDetails.industry || 'No industry set'} • Status: {clientDetails.status}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Primary Contact Card */}
              <Card className="border border-border/50 shadow-sm bg-muted/20">
                <CardContent className="p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Users className="h-3.5 w-3.5 text-primary" /> Primary Contact (PIC)
                  </h4>
                  {clientDetails.contacts?.length > 0 ? (
                    clientDetails.contacts.map((pic: any) => (
                      <div key={pic.id} className="pt-1 space-y-1">
                        <div className="font-semibold text-sm">{pic.name} {pic.is_primary && <span className="text-[10px] text-primary font-normal bg-primary/10 px-1.5 py-0.5 rounded">Primary</span>}</div>
                        {pic.email && <div className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {pic.email}</div>}
                        {pic.phone && <div className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {pic.phone}</div>}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">No contacts added.</p>
                  )}
                </CardContent>
              </Card>

              {/* Linked Projects */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-sky-500" /> Linked Projects ({clientDetails.projects?.length || 0})
                </h4>
                {clientDetails.projects?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No projects linked to this client yet.</p>
                ) : (
                  <div className="space-y-2">
                    {clientDetails.projects.map((p: any) => (
                      <div key={p.id} className="p-2.5 rounded-lg border border-border/50 bg-card text-xs flex justify-between items-center">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full font-medium">Status: {p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Associated Deals */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <GitPullRequest className="h-3.5 w-3.5 text-emerald-500" /> Deals ({clientDetails.deals?.length || 0})
                </h4>
                {clientDetails.deals?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No deals created for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {clientDetails.deals.map((d: any) => (
                      <div key={d.id} className="p-2.5 rounded-lg border border-border/50 bg-card text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{d.title}</p>
                          <p className="text-[11px] text-muted-foreground">Stage: {d.stage}</p>
                        </div>
                        <span className="font-bold text-emerald-600">
                          {d.value ? `Rp ${d.value.toLocaleString('id-ID')}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-500" /> Notes ({clientDetails.notes?.length || 0})
                </h4>
                <div className="space-y-2 mb-3">
                  {clientDetails.notes?.map((n: any) => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs">
                      <p className="text-foreground">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        by {n.author?.firstname} • {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a note for this client..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="text-xs h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNoteContent.trim()) {
                        addNoteMutation.mutate(newNoteContent.trim())
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={!newNoteContent.trim() || addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate(newNoteContent.trim())}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={async () => {
          if (clientToDelete) {
            await deleteMutation.mutateAsync(clientToDelete.id)
            setClientToDelete(null)
          }
        }}
        title={`Hapus Klien ${clientToDelete ? `"${clientToDelete.name}"` : ''}`}
        description="Apakah Anda yakin ingin menghapus data klien ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
