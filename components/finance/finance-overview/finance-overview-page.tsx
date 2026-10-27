'use client'

import React from 'react'
import { useLanguage } from '@/components/language-provider'
import { Wallet, Receipt, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { useFinanceOverview } from '../queries'

const formatRupiah = (value?: number | null) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`

export function FinanceOverviewPage({ user }: { user?: any }) {
  const { t } = useLanguage()
  const { data, isLoading, isError, error } = useFinanceOverview()

  const monthlyData = data?.monthlyData || []
  const recentTransactions = data?.recentTransactions || []
  const paidCount = data?.paidInvoicesCount || 0
  const unpaidCount = data?.outstandingInvoicesCount || 0
  const totalInvoices = paidCount + unpaidCount
  const paidPercent = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0
  const unpaidPercent = totalInvoices > 0 ? 100 - paidPercent : 0

  const invoiceData = [
    { name: t('Paid'), value: paidCount },
    { name: t('Unpaid'), value: unpaidCount }
  ]
  const COLORS = ['var(--muted)', 'var(--primary)']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary text-white px-3 py-2 rounded-md shadow-md text-xs flex flex-col gap-0.5">
          <span className="font-medium">{label}</span>
          <span className="font-bold text-sm">
            {t('Income')}: {Number(payload[0]?.value || 0).toLocaleString('id-ID')}
          </span>
          <span className="font-bold text-sm">
            {t('Expenses')}: {Number(payload[1]?.value || 0).toLocaleString('id-ID')}
          </span>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat data keuangan...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Gagal memuat ringkasan keuangan: {(error as any)?.message || 'terjadi kesalahan'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Finance Overview')}</h1>
          <p className="text-sm text-muted-foreground">{t('Monitor your financial health in real-time')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom kiri: grafik & transaksi */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-sm border-border bg-card rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border p-6">
              <CardTitle className="text-lg font-bold text-foreground">{t('Income & Expenses')}</CardTitle>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">{t('Income')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#7ca1b4]"></div>
                  <span className="text-muted-foreground">{t('Expenses')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} tickFormatter={(value) => (value === 0 ? '0' : Number(value).toLocaleString('id-ID'))} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="expenses" stroke="#7ca1b4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <CardTitle className="text-lg font-bold text-foreground">{t('Transactions')}</CardTitle>
              <a href="/finance/cash-bank" className="text-xs font-semibold text-primary hover:underline">
                {t('View all')}
              </a>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="flex flex-col">
                {recentTransactions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground italic">
                    Belum ada transaksi kas/bank. Catat lewat menu Kas &amp; Bank atau saat mencatat pembayaran faktur.
                  </p>
                ) : (
                  recentTransactions.map((tx: any) => {
                    const isExpense = tx.type === 'Expense'
                    const isTransfer = tx.type === 'Transfer'
                    return (
                      <div key={tx.id} className="flex justify-between py-3.5 border-b border-border last:border-0 text-sm gap-4">
                        <span className={`font-medium w-1/3 truncate ${isExpense ? 'text-primary' : 'text-foreground'}`} title={tx.description}>
                          {tx.description}
                        </span>
                        <span className="w-1/3 text-center text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`font-semibold w-1/3 text-right ${
                          isTransfer ? 'text-muted-foreground' : isExpense ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isExpense ? '- ' : isTransfer ? '' : '+ '}
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom kanan: metrik */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Card className="bg-primary border-none text-primary-foreground shadow-sm rounded-2xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white/90">{t('Total Balance')}</p>
                  <p className="text-2xl font-bold mt-1">{formatRupiah(data?.cashAndBank)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{t('Unpaid Invoices')}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{unpaidCount}</p>
                  {Number(data?.outstandingInvoices) > 0 && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{formatRupiah(data?.outstandingInvoices)}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Transactions')}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{data?.totalTransactionsCount || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Laba Bersih</p>
                <p className={`text-2xl font-bold mt-1 ${Number(data?.netProfit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatRupiah(data?.netProfit)}
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Pendapatan</span>
                    <span className="font-medium text-foreground">{formatRupiah(data?.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya pembelian</span>
                    <span className="font-medium text-foreground">{formatRupiah(data?.purchaseCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengeluaran operasional</span>
                    <span className="font-medium text-foreground">{formatRupiah(data?.operatingExpenses)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border bg-card rounded-2xl flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
              <CardTitle className="text-lg font-bold text-foreground">{t('Invoices')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <div className="h-[180px] w-full relative">
                {totalInvoices === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                    Belum ada faktur penjualan
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={invoiceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          startAngle={180}
                          endAngle={0}
                        >
                          {invoiceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[40%] left-4 text-xs font-bold text-foreground">{paidPercent}%</div>
                    <div className="absolute top-[40%] right-4 text-xs font-bold text-foreground">{unpaidPercent}%</div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-end mt-4 mb-6">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                    <span className="text-xs font-semibold text-muted-foreground">{t('Paid')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1 pl-3">{paidCount}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-xs font-semibold text-muted-foreground">{t('Unpaid')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1 pr-1">{unpaidCount}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => { window.location.href = '/finance/sales/faktur' }}
                className="w-full justify-between mt-auto border-border text-foreground hover:bg-muted cursor-pointer"
              >
                Lihat Semua Faktur Penjualan
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
