'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCrmFollowUps, createCrmFollowUp, updateCrmFollowUpStatus, deleteCrmFollowUp } from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreHorizontal, Trash, Calendar, Phone, Mail, CheckCircle2, Clock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const isPast = (date: Date) => {
  const today = new Date()
  today.setHours(0,0,0,0)
  return date < today
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

const TYPES = ['WhatsApp', 'Phone Call', 'Email', 'Meeting', 'Proposal', 'Other']

export function CrmFollowUpsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [filter, setFilter] = useState('All')
  
  const [formData, setFormData] = useState({
    type: 'WhatsApp',
    due_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const { data: followUps, isLoading } = useQuery({
    queryKey: ['crmFollowUps'],
    queryFn: async () => {
      const res = await getCrmFollowUps()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateCrmFollowUpStatus(id, status),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Follow-up marked as ${res.data.status}`)
        queryClient.invalidateQueries({ queryKey: ['crmFollowUps'] })
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
        setFormData({ type: 'WhatsApp', due_date: new Date().toISOString().split('T')[0], notes: '' })
        queryClient.invalidateQueries({ queryKey: ['crmFollowUps'] })
      } else {
        toast.error(res.error || 'Failed to schedule follow-up')
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
      (item.lead?.name && item.lead.name.toLowerCase().includes(search.toLowerCase()));
      
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WhatsApp': return <Phone className="h-4 w-4 text-green-500" />
      case 'Phone Call': return <Phone className="h-4 w-4 text-blue-500" />
      case 'Email': return <Mail className="h-4 w-4 text-rose-500" />
      case 'Meeting': return <Calendar className="h-4 w-4 text-purple-500" />
      default: return <Calendar className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Follow Ups</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Schedule Follow Up
        </Button>
      </div>
      
      <div className="flex items-center justify-between space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search follow-ups..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Today">Today</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Related To</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No follow-ups found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((item: any) => {
                const isOverdue = item.status !== 'Completed' && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date))
                const isDueToday = item.status !== 'Completed' && isToday(new Date(item.due_date))
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-medium text-sm">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
                        {isOverdue || isDueToday ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                        {formatDate(new Date(item.due_date))}
                        {isOverdue && <Badge variant="destructive" className="ml-2 text-[10px] h-4">Overdue</Badge>}
                        {isDueToday && <Badge variant="outline" className="ml-2 border-amber-500 text-amber-500 text-[10px] h-4">Today</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {item.client && (
                          <span className="text-sm font-medium">Client: {item.client.company_name}</span>
                        )}
                        {item.lead && (
                          <span className="text-sm font-medium">Lead: {item.lead.name}</span>
                        )}
                        {item.deal && (
                          <span className="text-xs text-muted-foreground">Deal: {item.deal.title}</span>
                        )}
                        {!item.client && !item.lead && !item.deal && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <span className="text-sm text-muted-foreground" title={item.notes}>{item.notes || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Completed' ? 'default' : item.status === 'Cancelled' ? 'secondary' : 'outline'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.status !== 'Completed' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'Completed' })}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                          {item.status !== 'Cancelled' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'Cancelled' })}
                            >
                              Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              if(confirm('Are you sure you want to delete this follow-up?')) {
                                deleteMutation.mutate(item.id)
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Follow Up</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={v => setFormData({...formData, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input 
                  type="date"
                  value={formData.due_date} 
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="e.g. Call to discuss pricing"
                />
              </div>
              
              <div className="rounded bg-muted/50 p-3 text-xs text-muted-foreground">
                <p>Note: Full creation linking to a specific Lead/Client is best done from the Lead/Client detail page. This creates an unlinked follow-up for now.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Scheduling...' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
