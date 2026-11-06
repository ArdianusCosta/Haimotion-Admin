'use client'

import React, { useState, useMemo } from 'react'
import { useLanguage } from '@/components/language-provider'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  Landmark,
  Clock,
  CircleAlert,
  CircleCheck,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { useFinanceOverview } from '../queries'

const formatRupiah = (value?: number | null) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`

type AnalyticsTab = 'revenue-expenses' | 'cash-flow' | 'profit-trend' | 'invoices-trend'

export function FinanceOverviewPage({ user }: { user?: any }) {
  const { t } = useLanguage()
  const { data, isLoading, isError, error, refetch, isRefetching } = useFinanceOverview()

  // State untuk filter analytics chart
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('revenue-expenses')

  // State untuk filter tabel transaksi
  const [txSearch, setTxSearch] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('ALL')
  const [txDateFilter, setTxDateFilter] = useState('ALL')

  const monthlyData = useMemo(() => data?.monthlyData || [], [data?.monthlyData])
  const recentTransactions = useMemo(() => data?.recentTransactions || [], [data?.recentTransactions])

  // Filter transaksi terkini
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter((tx: any) => {
      // Filter Type
      if (txTypeFilter !== 'ALL' && tx.type !== txTypeFilter) return false

      // Filter Search
      if (txSearch.trim()) {
        const query = txSearch.toLowerCase()
        const matchDesc = (tx.description || '').toLowerCase().includes(query)
        const matchRef = (tx.reference || '').toLowerCase().includes(query)
        const matchAcc = (tx.account || '').toLowerCase().includes(query)
        const matchCat = (tx.category || '').toLowerCase().includes(query)
        if (!matchDesc && !matchRef && !matchAcc && !matchCat) return false
      }

      // Filter Date (ALL, 7D, 30D, THIS_MONTH)
      if (txDateFilter !== 'ALL' && tx.date) {
        const txTime = new Date(tx.date).getTime()
        const now = new Date().getTime()
        const diffDays = (now - txTime) / (1000 * 3600 * 24)

        if (txDateFilter === '7D' && diffDays > 7) return false
        if (txDateFilter === '30D' && diffDays > 30) return false
        if (txDateFilter === 'THIS_MONTH') {
          const currentMonth = new Date().getMonth()
          const txMonth = new Date(tx.date).getMonth()
          if (currentMonth !== txMonth) return false
        }
      }

      return true
    })
  }, [recentTransactions, txSearch, txTypeFilter, txDateFilter])

  // Hitung invoice status
  const paidCount = data?.paidInvoicesCount || 0
  const unpaidCount = data?.outstandingInvoicesCount || 0
  const totalInvoices = paidCount + unpaidCount
  const paidPercent = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0

  // Custom Tooltip Recharts dengan Rupiah formatting
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs">
          <p className="font-semibold text-foreground mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}:</span>
                </div>
                <span className="font-mono font-medium text-foreground">
                  {formatRupiah(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>

        {/* Analytics & Invoices Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>

        {/* Transactions Table Skeleton */}
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  // Error State with Retry
  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center max-w-lg mx-auto my-12">
        <CircleAlert className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Gagal Memuat Data Keuangan</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as any)?.message || 'Terjadi kesalahan sistem saat mengambil data ikhtisar keuangan.'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 text-foreground">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Finance Overview')}</h1>
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">
              Enterprise Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau arus kas, pendapatan, piutang, dan kesehatan finansial secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>

          <Button
            size="sm"
            onClick={() => { window.location.href = '/finance/sales/faktur' }}
            className="h-9 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            Faktur Baru
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = '/finance/expenses' }}
            className="h-9 gap-1.5 text-xs border-border"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* 1. FINANCIAL SUMMARY METRIC CARDS (6 Key Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Cash & Bank */}
        <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-all rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Saldo Kas &amp; Bank</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight font-mono text-foreground">
                {formatRupiah(data?.cashAndBank)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seluruh akun kas &amp; bank</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-border bg-card shadow-sm hover:border-emerald-500/40 transition-all rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Pendapatan</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {formatRupiah(data?.totalRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Penjualan diakui (YTD)</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-border bg-card shadow-sm hover:border-rose-500/40 transition-all rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Pengeluaran</span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight font-mono text-rose-600 dark:text-rose-400">
                {formatRupiah(data?.totalExpenses)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Beban &amp; pembelian vendor</p>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-border bg-card shadow-sm hover:border-border transition-all rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Laba Bersih</span>
              <div className={`p-1.5 rounded-lg ${Number(data?.netProfit) >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {Number(data?.netProfit) >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>
            </div>
            <div>
              <p className={`text-lg font-bold tracking-tight font-mono ${Number(data?.netProfit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatRupiah(data?.netProfit)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Pendapatan - Biaya</p>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Receivables (Piutang) */}
        <Card className="border-border bg-card shadow-sm hover:border-amber-500/40 transition-all rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Piutang (Receivables)</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight font-mono text-amber-600 dark:text-amber-400">
                {formatRupiah(data?.outstandingInvoices)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                <span>{data?.outstandingInvoicesCount || 0} faktur</span>
                {Number(data?.overdueInvoicesCount) > 0 && (
                  <span className="text-rose-500 font-semibold">({data?.overdueInvoicesCount} jatuh tempo)</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Payables (Utang Usaha) */}
        <Card className="border-border bg-card shadow-sm hover:border-blue-500/40 transition-all rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Utang (Payables)</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight font-mono text-foreground">
                {formatRupiah(data?.outstandingPayables)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {data?.outstandingPayablesCount || 0} tagihan vendor belum lunas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. FINANCIAL ANALYTICS & INVOICE STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Chart Card */}
        <Card className="lg:col-span-2 border-border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-5 pb-3 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Analitik Finansial</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Tren kinerja keuangan tahun berjalan
              </CardDescription>
            </div>

            {/* Segmented Chart View Selector */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('revenue-expenses')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'revenue-expenses'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pendapatan vs Beban
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cash-flow')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'cash-flow'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Arus Kas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profit-trend')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'profit-trend'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tren Laba
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invoices-trend')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'invoices-trend'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Piutang vs Utang
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-6 flex-1">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'revenue-expenses' ? (
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : val)}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area type="monotone" name="Pendapatan" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                    <Area type="monotone" name="Pengeluaran" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
                  </AreaChart>
                ) : activeTab === 'cash-flow' ? (
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : val)}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar name="Arus Kas Bersih" dataKey="cashFlow" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : activeTab === 'profit-trend' ? (
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : val)}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line
                      type="monotone"
                      name="Laba Bersih"
                      dataKey="profit"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : val)}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar name="Piutang (Sales)" dataKey="receivables" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar name="Utang (Purchase)" dataKey="payables" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Quick Chart Legends */}
            <div className="flex flex-wrap items-center justify-between pt-4 mt-2 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {activeTab === 'revenue-expenses' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Pendapatan Riil</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Pengeluaran Lunas</span>
                    </div>
                  </>
                )}
                {activeTab === 'cash-flow' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Net Cash Flow (Kas Masuk - Kas Keluar)</span>
                  </div>
                )}
                {activeTab === 'profit-trend' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Margin Laba Bersih</span>
                  </div>
                )}
                {activeTab === 'invoices-trend' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Faktur Penjualan Terbit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span>Faktur Pembelian Masuk</span>
                    </div>
                  </>
                )}
              </div>
              <span className="text-[11px] font-mono">Tahun {new Date().getFullYear()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status & Collection Ratio Card */}
        <Card className="border-border bg-card shadow-sm rounded-2xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-3 border-b border-border/70">
            <CardTitle className="text-base font-bold text-foreground">Status Faktur Penjualan</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Efektivitas penagihan piutang pelanggan
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-6 flex-1 flex flex-col justify-between">
            {/* Progress Collection Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Tingkat Pelunasan Faktur</span>
                <span className="font-bold text-foreground font-mono">{paidPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Faktur Lunas</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">{paidCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dokumen selesai</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Belum Lunas</span>
                </div>
                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{unpaidCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{data?.overdueInvoicesCount || 0} overdue</p>
              </div>
            </div>

            {/* Detailed Financial Overview Stats */}
            <div className="space-y-2.5 pt-2 border-t border-border/70 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Total Nilai Piutang</span>
                <span className="font-mono font-medium text-foreground">{formatRupiah(data?.outstandingInvoices)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Total Nilai Utang Vendor</span>
                <span className="font-mono font-medium text-foreground">{formatRupiah(data?.outstandingPayables)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Biaya Pembelian Vendor</span>
                <span className="font-mono font-medium text-foreground">{formatRupiah(data?.purchaseCost)}</span>
              </div>
            </div>

            {/* Navigation Link to Invoices */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = '/finance/sales/faktur' }}
              className="w-full justify-between h-9 text-xs border-border hover:bg-muted font-medium"
            >
              <span>Buka Menu Faktur Penjualan</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 3. RECENT TRANSACTIONS TABLE (With Search & Filters) */}
      <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-5 pb-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-foreground">Transaksi Kas &amp; Bank Terbaru</CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {filteredTransactions.length} dari {recentTransactions.length}
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Mutasi mutakhir yang tercatat pada rekening perusahaan
            </CardDescription>
          </div>

          {/* Table Filters (Search, Type Filter, Date Filter) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background border-border"
              />
            </div>

            {/* Type Filter */}
            <Select value={txTypeFilter} onValueChange={(val) => setTxTypeFilter(val || 'ALL')}>
              <SelectTrigger className="h-8 w-32 text-xs bg-background border-border">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis</SelectItem>
                <SelectItem value="Income">Pemasukan</SelectItem>
                <SelectItem value="Expense">Pengeluaran</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={txDateFilter} onValueChange={(val) => setTxDateFilter(val || 'ALL')}>
              <SelectTrigger className="h-8 w-32 text-xs bg-background border-border">
                <SelectValue placeholder="Semua Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Waktu</SelectItem>
                <SelectItem value="7D">7 Hari Terakhir</SelectItem>
                <SelectItem value="30D">30 Hari Terakhir</SelectItem>
                <SelectItem value="THIS_MONTH">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { window.location.href = '/finance/cash-bank' }}
              className="h-8 text-xs text-primary hover:text-primary/80 gap-1 px-2.5"
            >
              Lihat Semua
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="w-[110px] text-xs font-semibold">ID / Ref</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold">Tanggal</TableHead>
                  <TableHead className="text-xs font-semibold">Keterangan &amp; Kategori</TableHead>
                  <TableHead className="text-xs font-semibold">Akun Kas / Bank</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Nominal</TableHead>
                  <TableHead className="w-[120px] text-center text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                        <FileText className="w-6 h-6 text-muted-foreground/50" />
                        <p className="font-medium">Tidak ada transaksi yang cocok</p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Ubah filter pencarian atau rekam mutasi baru lewat menu Kas &amp; Bank.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx: any) => {
                    const isExpense = tx.type === 'Expense'
                    const isTransfer = tx.type === 'Transfer'
                    const isIncome = tx.type === 'Income'

                    return (
                      <TableRow key={tx.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                        {/* Transaction ID / Reference */}
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          {tx.reference ? (
                            <Badge variant="outline" className="text-[10px] font-mono border-border">
                              {tx.reference}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">TX-{tx.id}</span>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'}
                        </TableCell>

                        {/* Description & Category */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-foreground max-w-sm truncate" title={tx.description}>
                              {tx.description || '-'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-normal px-1.5 py-0 bg-muted text-muted-foreground"
                              >
                                {tx.category || (isIncome ? 'Pemasukan' : isExpense ? 'Pengeluaran' : 'Transfer')}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* Account */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Landmark className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span>{tx.account || 'Kas/Bank'}</span>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isExpense
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-foreground'
                            }
                          >
                            {isIncome ? '+ ' : isExpense ? '- ' : ''}
                            {formatRupiah(tx.amount)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          >
                            <CircleCheck className="w-3 h-3 text-emerald-500" />
                            Selesai
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
