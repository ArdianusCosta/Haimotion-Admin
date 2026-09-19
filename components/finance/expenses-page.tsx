import React, { useState } from 'react'
import { Plus, Search, Download, MoreHorizontal } from 'lucide-react'
import { FinancePageHeader, FinanceStatusBadge } from './components'
import { ExpenseModal, ConfirmDeleteModal } from './components/modals'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExportExpenses, useImportExpenses } from './queries'
import { formatCurrency } from './utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRef } from 'react'
import { useLanguage } from '@/components/language-provider'

export function ExpensesPage() {  const { t, formatDate } = useLanguage()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: expenses, isLoading } = useExpenses({ search, category: category === 'All' ? undefined : category })
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const exportExpenses = useExportExpenses()
  const importExpenses = useImportExpenses()

  const handleSave = (data: any) => {
    if (selectedExpense) {
      updateExpense.mutate({ id: selectedExpense.id, data }, {
        onSuccess: () => setIsModalOpen(false)
      })
    } else {
      createExpense.mutate(data, {
        onSuccess: () => setIsModalOpen(false)
      })
    }
  }

  const handleDelete = () => {
    if (itemToDelete) {
      deleteExpense.mutate(itemToDelete, {
        onSuccess: () => {
          setItemToDelete(null)
          setDeleteModalOpen(false)
        }
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result
      if (typeof csv === 'string') {
        importExpenses.mutate(csv)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <FinancePageHeader 
        title={t('Expenses')} 
        description={t('Track and analyze your company spending.')}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={importExpenses.isPending}>
              {t('Import')} CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportExpenses.mutate()} disabled={exportExpenses.isPending}>
              <Download className="size-4" /> {t('Export')}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }}>
              <Plus className="size-4" /> {t('Add Expense')}
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search expenses..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-[250px] rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="All">All Categories</option>
              <option value="Operations">Operations</option>
              <option value="Salaries">Salaries</option>
              <option value="Marketing">Marketing</option>
              <option value="Utilities">Utilities</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Transportation">Transportation</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium text-xs">{t('Date')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Description')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Vendor')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Category')}</th>
                <th className="px-5 py-3 font-medium text-xs text-right">{t('Amount')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Status')}</th>
                <th className="px-5 py-3 font-medium text-xs text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : expenses?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    {t('No data found')}
                  </td>
                </tr>
              ) : (
                expenses?.map((exp: any) => (
                  <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="px-5 py-4 font-medium">{exp.description}</td>
                    <td className="px-5 py-4">{exp.vendor}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="px-5 py-4">
                      <FinanceStatusBadge status={exp.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedExpense(exp); setIsModalOpen(true); }}>{t('Edit')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setItemToDelete(exp.id); setDeleteModalOpen(true); }} className="text-rose-500 focus:text-rose-500">{t('Delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSave={handleSave} 
        initialData={selectedExpense} 
      />

      <ConfirmDeleteModal 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        title={t('Delete Expense')}
        description={t('Are you sure you want to delete this expense record? This action cannot be undone.')}
      />
    </div>
  )
}
