'use client'

import React, { useState } from 'react'
import { Download, Loader2, TrendingUp, Activity, FileText, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFinanceReport, useExportFinanceReport } from '@/components/finance/queries'
import { FINANCE_REPORTS, type FinanceReportKind } from '@/types/finance'

const ICONS: Record<string, any> = {
  'profit-loss': TrendingUp,
  'cash-flow': Activity,
  'expenses-by-category': FileText,
  outstanding: Clock
}

const isCurrencyKey = (key: string) => {
  const k = (key || '').toLowerCase().replace(/\s+/g, '_')
  return [
    'jumlah',
    'pemasukan',
    'pengeluaran',
    'selisih',
    'total',
    'dibayar',
    'sisa',
    'total_dibayar',
    'jumlah_transaksi',
    'saldo',
    'nominal'
  ].some(c => k.includes(c))
}

const prettyLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined || value === '') return '-'
  if (isCurrencyKey(key) && typeof value === 'number') {
    return `Rp ${value.toLocaleString('id-ID')}`
  }
  return String(value)
}

const firstDayOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
const today = () => new Date().toISOString().slice(0, 10)

export function ReportsPage() {
  const [report, setReport] = useState<FinanceReportKind>('profit-loss')
  const [from, setFrom] = useState(firstDayOfYear())
  const [to, setTo] = useState(today())

  const { data = null, isLoading: loading } = useFinanceReport({ report, from, to })
  const exportMutation = useExportFinanceReport()
  const exporting = exportMutation.isPending

  function handleExport() {
    exportMutation.mutate({ report, from, to })
  }

  const active = FINANCE_REPORTS.find(r => r.id === report)

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground">
            Laporan dihitung langsung dari data faktur, pembayaran, dan pengeluaran yang tersimpan.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting || loading || !data || data.rows.length === 0}
          className="border-border text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Ekspor CSV</span>
        </Button>
      </div>

      {/* Pilihan jenis laporan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FINANCE_REPORTS.map(item => {
          const Icon = ICONS[item.id] || FileText
          const selected = report === item.id
          return (
            <button
              key={item.id}
              onClick={() => setReport(item.id)}
              className={`text-left rounded-xl border p-4 transition-all cursor-pointer shadow-2xs ${
                selected 
                  ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30' 
                  : 'border-border bg-card hover:bg-muted/50 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${selected ? 'text-primary font-bold' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </button>
          )
        })}
      </div>

      {/* Filter Periode — Rapi, Berjarak & Responsif */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Filter Periode:</span>
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="from-date" className="text-xs font-medium text-muted-foreground shrink-0 cursor-pointer">
              Dari Tanggal:
            </label>
            <Input 
              id="from-date"
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              className="bg-background h-9 w-[160px] rounded-lg border-border text-xs px-2.5 shadow-2xs" 
            />
          </div>

          <div className="flex items-center gap-2.5">
            <label htmlFor="to-date" className="text-xs font-medium text-muted-foreground shrink-0 cursor-pointer">
              Sampai Tanggal:
            </label>
            <Input 
              id="to-date"
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              className="bg-background h-9 w-[160px] rounded-lg border-border text-xs px-2.5 shadow-2xs" 
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-semibold shadow-2xs">
            {active?.title}
          </span>
          <span className="text-[11px] bg-muted/70 px-2.5 py-1 rounded-md border border-border/60 font-mono">
            {from} s/d {to}
          </span>
        </div>
      </div>

      {/* Konten Laporan & Tabel */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> Menghitung laporan...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.summary || []).map((item, index) => (
              <Card key={index} className="p-4 border-border bg-card shadow-xs">
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                <p className="text-xl font-bold mt-1.5 tracking-tight">
                  {typeof item.value === 'number' ? `Rp ${item.value.toLocaleString('id-ID')}` : item.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Data Table — Header & Body Selaras 100% */}
          <Card className="shadow-xs border-border bg-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {(data?.columns || []).map((column: string) => {
                      const isNumeric = isCurrencyKey(column)
                      return (
                        <th
                          key={column}
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                            isNumeric ? 'text-right' : 'text-left'
                          }`}
                        >
                          {column}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!data || data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(1, data?.columns.length || 1)} className="px-6 py-12 text-center text-muted-foreground italic">
                        Tidak ada data pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row: any, rowIndex: number) => {
                      const keys = Object.keys(row)
                      return (
                        <tr key={rowIndex} className="hover:bg-muted/40 transition-colors">
                          {keys.map((key) => {
                            const isNumeric = isCurrencyKey(key)
                            const isSelisih = key.toLowerCase().includes('selisih')
                            const val = row[key]
                            return (
                              <td
                                key={key}
                                className={`px-6 py-4 text-sm ${
                                  isNumeric ? 'font-mono text-right' : 'text-left font-medium'
                                } ${
                                  isSelisih && typeof val === 'number'
                                    ? val >= 0
                                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                      : 'text-rose-600 dark:text-rose-400 font-semibold'
                                    : ''
                                }`}
                              >
                                {formatValue(key, val)}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Catatan: Laporan dihitung dengan basis kas — pendapatan diakui saat pembayaran faktur
            penjualan diterima, biaya diakui saat pembayaran faktur pembelian atau pengeluaran berstatus
            &quot;Paid&quot;.
          </p>
        </>
      )}
    </div>
  )
}
