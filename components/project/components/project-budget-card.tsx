import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFinanceBudgets, createFinanceBudget, getFinanceCategories } from '@/app/actions/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Wallet, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function ProjectBudgetCard({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  })

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['projectBudgets', projectId],
    queryFn: async () => {
      const res = await getFinanceBudgets(projectId)
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['financeCategories'],
    queryFn: async () => {
      const res = await getFinanceCategories()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: createFinanceBudget,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Budget added')
        setIsOpen(false)
        setFormData({ ...formData, name: '', amount: '', category_id: '' })
        queryClient.invalidateQueries({ queryKey: ['projectBudgets', projectId] })
      } else toast.error(res.error)
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.amount) return toast.error('Name and Amount are required')
    
    createMutation.mutate({
      project_id: projectId,
      name: formData.name,
      amount: parseFloat(formData.amount),
      start_date: formData.start_date,
      end_date: formData.end_date,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined
    })
  }

  const totalBudget = budgets?.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0) || 0
  const totalSpent = budgets?.reduce((sum: number, b: any) => sum + (Number(b.spent) || 0), 0) || 0
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Finance</p>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Wallet className="size-4 text-emerald-500" /> Project Budgets
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          <Plus className="size-4 mr-2" /> Add Budget
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : budgets?.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
            No budget allocated for this project yet.
          </div>
        ) : (
          <>
            <div className="p-4 bg-muted/30 rounded-lg border flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalBudget)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-semibold text-emerald-500">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalSpent)}
                </span>
              </div>
              
              <div className="mt-2 h-2 w-full bg-muted overflow-hidden rounded-full">
                <div 
                  className={`h-full ${percentage > 90 ? 'bg-destructive' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all`} 
                  style={{ width: `${Math.min(percentage, 100)}%` }} 
                />
              </div>
            </div>

            <div className="space-y-2">
              {budgets?.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-lg border bg-background text-sm">
                  <div>
                    <p className="font-medium">{b.name}</p>
                    {b.category && <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{b.category.name}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(b.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(b.spent)} spent</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Budget Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Marketing Campaign" required />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (IDR)</Label>
              <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="5000000" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
