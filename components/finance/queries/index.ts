import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getFinanceSummary, 
  getBankAccounts, 
  getExpenses, 
  getTransactions,
  createExpense,
  updateExpense,
  deleteExpense,
  createTransaction,
  deleteTransaction,
  exportExpensesCsv,
  importExpensesCsv,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  exportInvoicesCsv,
  recordInvoicePayment,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getProductsServices,
  createProductService,
  updateProductService,
  deleteProductService,
  getChartOfAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getFinanceReport,
  exportFinanceReportCsv
} from '@/app/actions/finance'
import type { InvoiceType, FinanceReportKind } from '@/types/finance'
import { toast } from 'sonner'

// =============================================================================
// QUERIES
// =============================================================================

// --- Overview ---
export function useFinanceOverview() {
  return useQuery({
    queryKey: ['finance', 'overview'],
    queryFn: () => getFinanceSummary(),
  })
}

// --- Bank Accounts & Cash ---
export function useBankAccounts() {
  return useQuery({
    queryKey: ['finance', 'bankAccounts'],
    queryFn: () => getBankAccounts(),
  })
}

export function useTransactions(filters?: { search?: string; accountId?: number }) {
  return useQuery({
    queryKey: ['finance', 'transactions', filters],
    queryFn: () => getTransactions(filters),
  })
}

// --- Expenses ---
export function useExpenses(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ['finance', 'expenses', filters],
    queryFn: () => getExpenses(filters),
  })
}

// --- Invoices (Sales & Purchases) ---
export function useInvoices(filters?: { type?: InvoiceType | string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['finance', 'invoices', filters],
    queryFn: () => getInvoices(filters),
  })
}

// --- Contacts (Pelanggan & Pemasok) ---
export function useContacts(filters?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ['finance', 'contacts', filters],
    queryFn: () => getContacts(filters),
  })
}

// --- Products & Services (Barang & Jasa) ---
export function useProductsServices(filters?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ['finance', 'productsServices', filters],
    queryFn: () => getProductsServices(filters),
  })
}

// --- Chart of Accounts (Akun Perkiraan) ---
export function useChartOfAccounts(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['finance', 'chartOfAccounts', filters],
    queryFn: () => getChartOfAccounts(filters),
  })
}

// --- Reports ---
export function useFinanceReport(params: { report: FinanceReportKind | string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['finance', 'reports', params],
    queryFn: () => getFinanceReport(params),
  })
}

// =============================================================================
// MUTATIONS
// =============================================================================

// --- Expense Mutations ---
export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Pengeluaran berhasil dicatat.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mencatat pengeluaran.')
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Pengeluaran berhasil diperbarui.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui pengeluaran.')
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Pengeluaran berhasil dihapus.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus pengeluaran.')
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
      toast.success('Pengeluaran berhasil diekspor.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengekspor pengeluaran.')
  })
}

export function useImportExpenses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (csvContent: string) => importExpensesCsv(csvContent),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success(`Berhasil mengimpor ${count} pengeluaran.`)
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengimpor pengeluaran.')
  })
}

// --- Cash & Bank Transaction Mutations ---
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Transaksi kas/bank berhasil dicatat.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mencatat transaksi.')
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Transaksi kas/bank berhasil dihapus.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus transaksi.')
  })
}

// --- Invoice Mutations ---
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Faktur berhasil dibuat.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal membuat faktur.')
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Faktur berhasil diperbarui.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui faktur.')
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Faktur berhasil dihapus.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus faktur.')
  })
}

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      invoiceId: number
      amount: number
      paymentDate?: string
      paymentMethod?: string
      accountId?: number | null
      notes?: string
    }) => recordInvoicePayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'reports'] })
      toast.success('Pembayaran faktur berhasil dicatat.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mencatat pembayaran.')
  })
}

export function useExportInvoices() {
  return useMutation({
    mutationFn: (type?: InvoiceType | string) => exportInvoicesCsv(type),
    onSuccess: (csvString, type) => {
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      const prefix = type ? `${String(type).toLowerCase()}_invoices` : 'invoices'
      a.setAttribute('download', `${prefix}_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Faktur berhasil diekspor.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengekspor faktur.')
  })
}

// --- Contact Mutations (Pelanggan & Pemasok) ---
export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'contacts'] })
      toast.success('Kontak berhasil disimpan.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menyimpan kontak.')
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'contacts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Kontak berhasil diperbarui.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui kontak.')
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'contacts'] })
      toast.success('Kontak berhasil dihapus.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus kontak.')
  })
}

// --- Products & Services Mutations (Barang & Jasa) ---
export function useCreateProductService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createProductService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'productsServices'] })
      toast.success('Produk / jasa berhasil disimpan.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menyimpan produk/jasa.')
  })
}

export function useUpdateProductService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProductService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'productsServices'] })
      toast.success('Produk / jasa berhasil diperbarui.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui produk/jasa.')
  })
}

export function useDeleteProductService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProductService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'productsServices'] })
      toast.success('Produk / jasa berhasil dihapus.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus produk/jasa.')
  })
}

// --- Chart of Accounts Mutations (Akun Perkiraan) ---
export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'chartOfAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Akun perkiraan berhasil ditambahkan.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menambahkan akun perkiraan.')
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'chartOfAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Akun perkiraan berhasil diperbarui.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal memperbarui akun perkiraan.')
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'chartOfAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] })
      toast.success('Akun perkiraan berhasil dihapus.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menghapus akun perkiraan.')
  })
}

// --- Report Mutations ---
export function useExportFinanceReport() {
  return useMutation({
    mutationFn: (params: { report: FinanceReportKind | string; from?: string; to?: string }) =>
      exportFinanceReportCsv(params),
    onSuccess: (csvString, variables) => {
      if (!csvString) {
        toast.info('Tidak ada data untuk diekspor pada periode ini')
        return
      }
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      a.setAttribute(
        'download',
        `${variables.report}_${variables.from || ''}_${variables.to || ''}.csv`
      )
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Laporan berhasil diekspor.')
    },
    onError: (err: any) => toast.error(err.message || 'Gagal mengekspor laporan.')
  })
}
