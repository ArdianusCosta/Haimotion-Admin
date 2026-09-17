import React, { useState } from 'react'
import { Plus, Search, Filter, Download, MoreHorizontal } from 'lucide-react'
import { FinancePageHeader, FinanceStatusBadge } from './components'
import { InvoiceModal, ConfirmDeleteModal } from './components/modals'
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useExportInvoices, useImportInvoices } from './queries'
import { formatCurrency } from './utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRef } from 'react'
import { useLanguage } from '@/components/language-provider'

export function InvoicesPage() {
  const { t, formatDate } = useLanguage()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: invoices, isLoading } = useInvoices({ search, status: status === 'All' ? undefined : status })
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const deleteInvoice = useDeleteInvoice()
  const exportInvoices = useExportInvoices()
  const importInvoices = useImportInvoices()

  const handleSave = (data: any) => {
    if (selectedInvoice) {
      updateInvoice.mutate({ id: selectedInvoice.id, data }, {
        onSuccess: () => setIsModalOpen(false)
      })
    } else {
      createInvoice.mutate(data, {
        onSuccess: () => setIsModalOpen(false)
      })
    }
  }

  const handleDelete = () => {
    if (itemToDelete) {
      deleteInvoice.mutate(itemToDelete, {
        onSuccess: () => {
          toast.success('Invoice deleted successfully.')
          setItemToDelete(null)
        }
      })
    }
  }

  const handleRecordPayment = (inv: any) => {
    updateInvoice.mutate({ id: inv.id, data: { status: 'Paid' } }, {
      onSuccess: () => toast.success(`Payment recorded for ${inv.reference}`)
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result
      if (typeof csv === 'string') {
        importInvoices.mutate(csv)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <FinancePageHeader 
        title={t('Invoices')} 
        description={t('Track and manage your company invoices.')}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={importInvoices.isPending}>
              {t('Import')} CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportInvoices.mutate()} disabled={exportInvoices.isPending}>
              <Download className="size-4" /> {t('Export')}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }}>
              <Plus className="size-4" /> {t('Create Invoice')}
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
                placeholder="Search invoices..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-[250px] rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium text-xs">{t('Reference')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Customer')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Date')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Due Date')}</th>
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : invoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    {t('No data found')}
                  </td>
                </tr>
              ) : (
                invoices?.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium">{inv.reference}</td>
                    <td className="px-5 py-4">{inv.customer_name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(inv.date)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-4 text-right font-medium">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-4">
                      <FinanceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setIsModalOpen(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRecordPayment(inv)}>Record Payment</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setItemToDelete(inv.id); setDeleteModalOpen(true); }} className="text-rose-500 focus:text-rose-500">Delete</DropdownMenuItem>
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

      <InvoiceModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSave={handleSave} 
        initialData={selectedInvoice} 
      />

      <ConfirmDeleteModal 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </div>
  )
}
