export type InvoiceType = 'SALES' | 'PURCHASE'

export type FinanceReportKind = 'profit-loss' | 'cash-flow' | 'expenses-by-category' | 'outstanding'

export interface FinanceReportDefinition {
  id: FinanceReportKind
  title: string
  description: string
}

export const FINANCE_REPORTS: FinanceReportDefinition[] = [
  {
    id: 'profit-loss',
    title: 'Laba Rugi',
    description: 'Pendapatan, biaya pembelian, dan pengeluaran operasional pada periode terpilih (basis kas).'
  },
  {
    id: 'cash-flow',
    title: 'Arus Kas',
    description: 'Mutasi uang masuk dan keluar per bulan dari transaksi kas/bank (transfer antar akun tidak dihitung).'
  },
  {
    id: 'expenses-by-category',
    title: 'Pengeluaran per Kategori',
    description: 'Total pengeluaran yang sudah dibayar, dikelompokkan per kategori.'
  },
  {
    id: 'outstanding',
    title: 'Piutang Faktur',
    description: 'Faktur penjualan yang belum lunas beserta sisa tagihannya.'
  }
]
