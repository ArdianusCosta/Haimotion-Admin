import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getFinanceSummary, 
  getBankAccounts, 
  getInvoices, 
  getExpenses, 
  getTransactions,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createExpense,
  updateExpense,
  deleteExpense,
  createTransaction,
  exportInvoicesCsv,
  importInvoicesCsv,
  exportExpensesCsv,
  importExpensesCsv
} from '@/app/actions/finance'
import { toast } from 'sonner'

// --- QUERIES ---

export function useFinanceOverview() {
  return useQuery({
    queryKey: ['finance', 'overview'],
    queryFn: () => getFinanceSummary(),
  })
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ['finance', 'bankAccounts'],
    queryFn: () => getBankAccounts(),
  })
}

export function useInvoices(filters?: { status?: string, search?: string }) {
  return useQuery({
    queryKey: ['finance', 'invoices', filters],
    queryFn: () => getInvoices(filters),
  })
}

export function useExpenses(filters?: { category?: string, search?: string }) {
  return useQuery({
    queryKey: ['finance', 'expenses', filters],
    queryFn: () => getExpenses(filters),
  })
}

export function useTransactions(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['finance', 'transactions', filters],
    queryFn: () => getTransactions(filters),
  })
}

// --- MUTATIONS ---

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Invoice created successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create invoice.')
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Invoice updated successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update invoice.')
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Invoice deleted successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete invoice.')
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Expense created successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create expense.')
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Expense updated successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update expense.')
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Expense deleted successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete expense.')
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      toast.success('Transaction created successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create transaction.')
  })
}

// --- EXPORT / IMPORT MUTATIONS ---

export function useExportInvoices() {
  return useMutation({
    mutationFn: () => exportInvoicesCsv(),
    onSuccess: (csvString) => {
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      a.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Invoices exported successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to export invoices.')
  })
}

export function useImportInvoices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (csvContent: string) => importInvoicesCsv(csvContent),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success(`Successfully imported ${count} invoices.`)
    },
    onError: (err: any) => toast.error(err.message || 'Failed to import invoices.')
  })
}

export function useExportExpenses() {
  return useMutation({
    mutationFn: () => exportExpensesCsv(),
    onSuccess: (csvString) => {
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      a.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Expenses exported successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to export expenses.')
  })
}

export function useImportExpenses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (csvContent: string) => importExpensesCsv(csvContent),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success(`Successfully imported ${count} expenses.`)
    },
    onError: (err: any) => toast.error(err.message || 'Failed to import expenses.')
  })
}
