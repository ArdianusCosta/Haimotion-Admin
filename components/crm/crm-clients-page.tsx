'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmClients, createCrmClient, deleteCrmClient } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Mail, Phone, Building, Briefcase } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function CrmClientsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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
        setFormData({
          company_name: '',
          industry: '',
          website: '',
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          status: 'Active',
          source: ''
        })
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
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
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Open Deals</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredClients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients?.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium flex items-center gap-2">
                        {client.company_name}
                      </span>
                      {client.website && (
                        <span className="text-xs text-muted-foreground">{client.website}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.industry ? (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" /> {client.industry}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <span>{client.projects?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{client.deals?.length || 0}</span>
                    </div>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            if(confirm('Are you sure you want to delete this client?')) {
                              deleteMutation.mutate(client.id)
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
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium border-b pb-2">Company Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input 
                    value={formData.company_name} 
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input 
                    value={formData.industry} 
                    onChange={e => setFormData({...formData, industry: e.target.value})}
                    placeholder="e.g. Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input 
                    value={formData.website} 
                    onChange={e => setFormData({...formData, website: e.target.value})}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={v => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <h4 className="text-sm font-medium border-b pb-2 pt-2">Primary Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input 
                    value={formData.contact_name} 
                    onChange={e => setFormData({...formData, contact_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.contact_email} 
                    onChange={e => setFormData({...formData, contact_email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone / WhatsApp</Label>
                  <Input 
                    value={formData.contact_phone} 
                    onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="+62..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
