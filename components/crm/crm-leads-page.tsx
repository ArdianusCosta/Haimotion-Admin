'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmLeads, createCrmLead, deleteCrmLead, updateCrmLeadStage, convertCrmLead } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Mail, Phone, Target, GitPullRequest } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function CrmLeadsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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
        setFormData({
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search leads..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Info</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads?.map((lead: any) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium flex items-center gap-2">
                        {lead.name}
                      </span>
                      <div className="flex flex-col gap-1 mt-1">
                        {lead.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3"/> {lead.email}</span>}
                        {lead.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3"/> {lead.phone}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.company || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={lead.status === 'Lost' ? 'destructive' : lead.status === 'Converted' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3" /> {lead.pipeline_stage}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.estimated_value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(lead.estimated_value) : '-'}
                  </TableCell>
                  <TableCell>
                    {lead.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={lead.assigned_user.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">{lead.assigned_user.firstname?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{lead.assigned_user.firstname}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {lead.status !== 'Converted' && (
                          <DropdownMenuItem 
                            onClick={() => convertMutation.mutate(lead.id)}
                            className="font-medium text-primary focus:text-primary focus:bg-primary/10"
                          >
                            Convert to Client & Deal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => updateStageMutation.mutate({ id: lead.id, stage: 'Qualified', status: 'In Progress' })}
                        >
                          Mark as Qualified
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStageMutation.mutate({ id: lead.id, stage: 'Lost', status: 'Lost' })}
                        >
                          Mark as Lost
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            if(confirm('Are you sure you want to delete this lead?')) {
                              deleteMutation.mutate(lead.id)
                            }
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
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input 
                    value={formData.company} 
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone / WhatsApp</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value, whatsapp: e.target.value})}
                    placeholder="+62..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select 
                    value={formData.source} 
                    onValueChange={v => setFormData({...formData, source: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Value (IDR)</Label>
                  <Input 
                    type="number"
                    value={formData.estimated_value} 
                    onChange={e => setFormData({...formData, estimated_value: e.target.value})}
                    placeholder="50000000"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
