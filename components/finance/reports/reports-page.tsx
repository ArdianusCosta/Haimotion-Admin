'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, TrendingUp, Activity, FileText, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFinanceReport, useExportFinanceReport } from '@/components/finance/queries'
import { FINANCE_REPORTS, type FinanceReportKind } from '@/types/finance'
import { toast } from 'sonner'

const ICONS: Record<string, any> = {
  'profit-loss': TrendingUp,
  'cash-flow': Activity,
  'expenses-by-category': FileText,
  outstanding: Clock
}

const isCurrencyKey = (key: string) =>
  ['jumlah', 'pemasukan', 'pengeluaran', 'selisih', 'total', 'dibayar', 'sisa', 'total_dibayar'].includes(key)

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
          className="border-border text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Ekspor CSV</span>
        </Button>
      </div>

      {/* Pilihan laporan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FINANCE_REPORTS.map(item => {
          const Icon = ICONS[item.id] || FileText
          const selected = report === item.id
          return (
            <button
              key={item.id}
              onClick={() => setReport(item.id)}
              className={`text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-semibold">{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </button>
          )
        })}
      </div>

      {/* Periode */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-background h-10 w-full md:w-[180px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-background h-10 w-full md:w-[180px]" />
        </div>
        <p className="text-xs text-muted-foreground md:pb-3">
          {active?.title} · {from} s/d {to}
        </p>
      </div>

      {/* Ringkasan */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Menghitung laporan...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.summary || []).map((item, index) => (
              <Card key={index} className="p-4 border-border bg-card">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold mt-1">
                  {typeof item.value === 'number' ? `Rp ${item.value.toLocaleString('id-ID')}` : item.value}
                </p>
              </Card>
            ))}
          </div>

          <Card className="shadow-xs border-border bg-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {(data?.columns || []).map(column => (
                      <th key={column} className="px-6 py-4 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!data || data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(1, data?.columns.length || 1)} className="px-6 py-10 text-center text-muted-foreground italic">
                        Tidak ada data pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
                        {Object.keys(row).map(key => (
                          <td
                            key={key}
                            className={`px-6 py-3.5 ${isCurrencyKey(key) ? 'font-mono text-right' : ''}`}
                          >
                            {formatValue(key, row[key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground">
            Catatan: laporan Laba Rugi dihitung dengan basis kas — pendapatan diakui saat pembayaran faktur
            penjualan diterima, biaya diakui saat pembayaran faktur pembelian atau pengeluaran berstatus
            &quot;Paid&quot;. Kolom tabel mengikuti label dari server ({Object.keys(data?.rows?.[0] || {}).map(prettyLabel).join(', ') || '-'}).
          </p>
        </>
      )}
    </div>
  )
}
