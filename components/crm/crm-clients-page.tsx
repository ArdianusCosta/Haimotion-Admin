'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmClients, createCrmClient, deleteCrmClient } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Building, Briefcase, Globe, Filter, Users } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'Active',
    source: ''
  })

  const { data: clients, isLoading } = useQuery({
    queryKey: ['crmClients'],
    queryFn: async () => {
      const res = await getCrmClients()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: createCrmClient,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Client created successfully')
        setIsCreateOpen(false)
        setFormData({ company_name: '', industry: '', website: '', contact_name: '', contact_email: '', contact_phone: '', status: 'Active', source: '' })
        queryClient.invalidateQueries({ queryKey: ['crmClients'] })
      } else {
        toast.error(res.error || 'Failed to create client')
      }
    },
    onError: (error: any) => toast.error(error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCrmClient,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Client deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['crmClients'] })
      } else {
        toast.error(res.error || 'Failed to delete client')
      }
    }
  })

  const filteredClients = clients?.filter((client: any) =>
    client.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (client.industry && client.industry.toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.company_name) return toast.error('Company Name is required')
    createMutation.mutate(formData)
  }

  const activeCount = clients?.filter((c: any) => c.status === 'Active').length || 0
  const prospectCount = clients?.filter((c: any) => c.status === 'Prospect').length || 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your client portfolio and relationships.</p>
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

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
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
              <TableHead className="font-semibold text-foreground/70 pl-6">Company</TableHead>
              <TableHead className="font-semibold text-foreground/70">Industry</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="font-semibold text-foreground/70">Projects</TableHead>
              <TableHead className="font-semibold text-foreground/70">Open Deals</TableHead>
              <TableHead className="font-semibold text-foreground/70 pr-6 w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-10 w-[160px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
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
              filteredClients?.map((client: any) => (
                <TableRow key={client.id} className="group hover:bg-muted/20 transition-colors border-b border-border/40">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(client.company_name)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                        {getInitials(client.company_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{client.company_name}</div>
                        {client.website && (
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                            <Globe className="h-3 w-3" /> {client.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.industry ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Building className="h-3 w-3 text-violet-500" />
                        </div>
                        <span className="text-sm text-foreground/80">{client.industry}</span>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
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
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
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
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add New Client</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">Fill in the client company details below.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Building className="h-3.5 w-3.5" /> Company Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name *</Label>
                  <Input value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} placeholder="e.g. Acme Corp" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</Label>
                  <Input value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} placeholder="e.g. Technology" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                  <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Primary Contact
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact Name</Label>
                  <Input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="john@example.com" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone / WhatsApp</Label>
                  <Input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+62..." />
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
