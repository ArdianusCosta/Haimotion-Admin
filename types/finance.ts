export type InvoiceType = 'SALES' | 'PURCHASE'

export type FinanceReportKind =
  | 'profit-loss'
  | 'balance-sheet'
  | 'general-ledger'
  | 'cash-flow'
  | 'expenses-by-category'
  | 'outstanding'

export interface FinanceReportDefinition {
  id: FinanceReportKind
  title: string
  description: string
}

export const FINANCE_REPORTS: FinanceReportDefinition[] = [
  {
    id: 'profit-loss',
    title: 'Laba Rugi',
    description: 'Pendapatan, beban pembelian, dan beban operasional pada periode terpilih dengan perbandingan periode.'
  },
  {
    id: 'balance-sheet',
    title: 'Neraca Keuangan',
    description: 'Posisi Aset, Liabilitas, dan Ekuitas perusahaan untuk memastikan keseimbangan neraca keuangan.'
  },
  {
    id: 'general-ledger',
    title: 'Buku Besar',
    description: 'Rincian transaksi debit, kredit, dan saldo berjalan per akun kas/bank dan buku pembukuan.'
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
    title: 'Piutang & Utang Faktur',
    description: 'Faktur penjualan dan pembelian yang belum lunas beserta sisa tagihannya.'
  }
]
