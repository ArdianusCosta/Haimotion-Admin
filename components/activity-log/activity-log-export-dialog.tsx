'use client'

import { useState, useRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActivityLog } from '@/types/activity-log'
import { Download, FileSpreadsheet, Printer, Loader2, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ActivityLogExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logs: ActivityLog[]
  filterUser?: string
  filterModule?: string
}

export function ActivityLogExportDialog({
  open,
  onOpenChange,
  logs,
  filterUser = 'all',
  filterModule = 'all'
}: ActivityLogExportDialogProps) {
  const [exportLimit, setExportLimit] = useState<number | 'all'>(50)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [previewPageIndex, setPreviewPageIndex] = useState(0)
  const printContainerRef = useRef<HTMLDivElement>(null)

  // Filter and limit records
  const exportData = useMemo(() => {
    if (!logs) return []
    if (exportLimit === 'all') return logs
    return logs.slice(0, exportLimit)
  }, [logs, exportLimit])

  // Pagination for A4 letterhead pages:
  // Page 1 has header info + meta box, fits ~11 items cleanly
  // Subsequent pages fit ~16 items
  const pages = useMemo(() => {
    if (exportData.length === 0) return [[]]
    const result: ActivityLog[][] = []
    const firstPageItems = 11
    const subsequentPageItems = 16

    result.push(exportData.slice(0, firstPageItems))
    let currentIdx = firstPageItems
    while (currentIdx < exportData.length) {
      result.push(exportData.slice(currentIdx, currentIdx + subsequentPageItems))
      currentIdx += subsequentPageItems
    }
    return result
  }, [exportData])

  const totalPages = Math.max(1, pages.length)
  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date())
  }, [])

  // Handle PDF Export
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true)
      const toastId = toast.loading('Memproses dan merender laporan PDF resmi...')

      const { jsPDF } = await import('jspdf')
      const { toPng } = await import('html-to-image')

      const pdf = new jsPDF('p', 'mm', 'a4')

      for (let i = 0; i < pages.length; i++) {
        const pageElement = document.getElementById(`export-pdf-page-${i}`)
        if (!pageElement) continue

        const imgData = await toPng(pageElement, {
          pixelRatio: 2,
          quality: 0.98,
          backgroundColor: '#ffffff'
        })

        if (i > 0) {
          pdf.addPage('a4', 'portrait')
        }
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      pdf.save(`HaiMotion_Activity_Log_Report_${dateStr}.pdf`)

      toast.success('Laporan PDF resmi dengan kop surat berhasil diunduh!', { id: toastId })
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to generate PDF:', err)
      toast.error('Gagal menghasilkan PDF: ' + (err?.message || 'Terjadi kesalahan sistem'))
    } finally {
      setIsExportingPdf(false)
    }
  }

  // Handle Excel Export
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true)
      const toastId = toast.loading('Menyiapkan file Excel...')
      const XLSX = await import('xlsx')

      const excelRows = exportData.map((l, idx) => ({
        'No': idx + 1,
        'Waktu': l.created_at ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(l.created_at)) : '-',
        'Pengguna': l.user?.name || `${l.user?.firstname || ''} ${l.user?.lastname || ''}`.trim() || 'User',
        'Email': l.user?.email || '-',
        'Tipe Aktivitas': l.activity_type,
        'Deskripsi': l.description,
        'IP Address': l.ip_address || '-',
        'User Agent': l.user_agent || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(excelRows)
      // Auto column width
      const colWidths = [
        { wch: 6 },
        { wch: 22 },
        { wch: 25 },
        { wch: 28 },
        { wch: 18 },
        { wch: 45 },
        { wch: 18 },
        { wch: 35 }
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs')

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      XLSX.writeFile(wb, `HaiMotion_Activity_Logs_${dateStr}.xlsx`)

      toast.success('Data Excel berhasil diunduh!', { id: toastId })
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to generate Excel:', err)
      toast.error('Gagal menghasilkan Excel')
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handle Direct Print
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0 overflow-hidden flex flex-col bg-background border shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Export Activity Log</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unduh dokumen laporan audit resmi dengan Kop Surat PT. Hai Motion Kreatif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel || isExportingPdf}
              className="gap-2 text-xs"
            >
              {isExportingExcel ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5 text-emerald-600" />}
              Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isExportingPdf}
              className="gap-2 text-xs"
            >
              <Printer className="size-3.5" />
              Cetak (Print)
            </Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf || isExportingExcel}
              className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isExportingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Unduh PDF Resmi
            </Button>
          </div>
        </div>

        {/* Content body: Controls on top, Preview scrollable below */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
          {/* Options toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Jumlah Data:</span>
                <select
                  value={String(exportLimit)}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
                    setExportLimit(val)
                    setPreviewPageIndex(0)
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="25">25 Log Terakhir</option>
                  <option value="50">50 Log Terakhir</option>
                  <option value="100">100 Log Terakhir</option>
                  <option value="all">Semua ({logs.length} Data)</option>
                </select>
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Filter Aktif:</span>
                <Badge variant="secondary" className="text-[11px] font-normal">
                  Modul: {filterModule === 'all' ? 'Semua' : filterModule}
                </Badge>
                {filterUser !== 'all' && (
                  <Badge variant="secondary" className="text-[11px] font-normal">
                    Pengguna: {filterUser}
                  </Badge>
                )}
                <span className="text-foreground font-medium ml-1">
                  ({exportData.length} aktivitas · {totalPages} halaman PDF)
                </span>
              </div>
            </div>

            {/* Page switcher for preview */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="size-7 p-0"
                  onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))}
                  disabled={previewPageIndex === 0}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs font-medium px-1">
                  Hal. {previewPageIndex + 1} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="size-7 p-0"
                  onClick={() => setPreviewPageIndex(p => Math.min(totalPages - 1, p + 1))}
                  disabled={previewPageIndex >= totalPages - 1}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Live Document Preview Display */}
          <div className="flex justify-center pb-6">
            <div className="shadow-2xl border rounded-lg overflow-hidden bg-white max-w-[794px] w-full transition-all">
              {renderA4Page(pages[previewPageIndex] || [], previewPageIndex, totalPages, currentDateFormatted, filterUser, filterModule, false)}
            </div>
          </div>
        </div>

        {/* Hidden Container for offscreen multi-page rendering and printing */}
        <div className="hidden">
          <div ref={printContainerRef} id="export-pdf-all-pages-container">
            {pages.map((pageLogs, pageIdx) => (
              <div key={pageIdx} id={`export-pdf-page-${pageIdx}`}>
                {renderA4Page(pageLogs, pageIdx, totalPages, currentDateFormatted, filterUser, filterModule, true)}
              </div>
            ))}
          </div>
        </div>

        {/* Global Print Styles for window.print() */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #export-pdf-all-pages-container,
              #export-pdf-all-pages-container * {
                visibility: visible !important;
              }
              #export-pdf-all-pages-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
              }
              .printable-page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `
        }} />
      </DialogContent>
    </Dialog>
  )
}

// Function to render an exact A4 page with the official PT. Hai Motion Kreatif letterhead
function renderA4Page(
  pageLogs: ActivityLog[],
  pageIndex: number,
  totalPages: number,
  currentDateFormatted: string,
  filterUser: string,
  filterModule: string,
  isPrintMode: boolean
) {
  const isFirstPage = pageIndex === 0

  return (
    <div
      style={{
        width: '794px',
        height: '1123px',
        backgroundImage: "url('/letterhead.png')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#ffffff'
      }}
      className={`relative text-slate-900 box-border flex flex-col font-sans select-none ${isPrintMode ? 'printable-page-break' : ''}`}
    >
      {/* 
        Top Padding: 160px
        Ensures complete clearance from the top geometric graphic and "Hai Motion PT. HAI MOTION KREATIF" logo
      */}
      <div style={{ height: '160px' }} className="shrink-0" />

      {/* Main Content Area: Padding Left 48px, Right 48px */}
      <div className="flex-1 px-12 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Document Header on Page 1 */}
          {isFirstPage ? (
            <div className="mb-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-3">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                    Laporan Audit Log Aktivitas
                  </h1>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                    HaiMotion Admin & Resource Management System
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold tracking-wider uppercase border border-slate-200">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Dokumen Resmi
                  </span>
                </div>
              </div>

              {/* Metadata strip */}
              <div className="grid grid-cols-4 gap-2 py-2.5 px-3.5 my-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">Dicetak Pada:</span>
                  <span className="font-semibold text-slate-800">{currentDateFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">Filter Modul:</span>
                  <span className="font-semibold text-slate-800 capitalize">{filterModule === 'all' ? 'Semua Modul' : filterModule}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">Filter Pengguna:</span>
                  <span className="font-semibold text-slate-800">{filterUser === 'all' ? 'Semua Pengguna' : filterUser}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">Klasifikasi:</span>
                  <span className="font-semibold text-slate-800">Internal Audit</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between border-b pb-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Laporan Log Aktivitas (Lanjutan)</span>
              <span>Dicetak: {currentDateFormatted}</span>
            </div>
          )}

          {/* Activity Log Table */}
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2 px-2 text-center w-8">No</th>
                <th className="py-2 px-2.5 w-28">Waktu & Tanggal</th>
                <th className="py-2 px-2.5 w-32">Pengguna</th>
                <th className="py-2 px-2 w-24">Modul / Aksi</th>
                <th className="py-2 px-2.5">Deskripsi Aktivitas</th>
                <th className="py-2 px-2 w-24 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {pageLogs.map((log, idx) => {
                const globalIndex = pageIndex === 0 ? idx + 1 : 11 + (pageIndex - 1) * 16 + idx + 1
                const formattedTime = log.created_at
                  ? new Intl.DateTimeFormat('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(new Date(log.created_at))
                  : '-'

                const userName = log.user?.name || `${log.user?.firstname || ''} ${log.user?.lastname || ''}`.trim() || 'User'
                const typeLower = (log.activity_type || '').toLowerCase()
                const isLogin = typeLower.includes('login')
                const isLogout = typeLower.includes('logout')

                return (
                  <tr key={log.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-2 text-center text-slate-400 font-medium">{globalIndex}</td>
                    <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap font-medium">{formattedTime}</td>
                    <td className="py-2 px-2.5 font-semibold text-slate-800 truncate max-w-[130px]" title={userName}>
                      {userName}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase ${
                          isLogin
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLogout
                            ? 'bg-slate-200 text-slate-700'
                            : typeLower.includes('create')
                            ? 'bg-blue-100 text-blue-800'
                            : typeLower.includes('update')
                            ? 'bg-amber-100 text-amber-800'
                            : typeLower.includes('delete')
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {isLogin ? 'Login' : isLogout ? 'Logout' : log.activity_type.split('_')[0]}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 font-normal leading-relaxed break-words">
                      {log.description}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-500 text-[9px] whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* In-content page footer info just above the letterhead bottom graphical footer */}
        <div className="pt-2 pb-1 border-t border-slate-200/70 flex items-center justify-between text-[9px] text-slate-400">
          <span>PT. Hai Motion Kreatif · Dokumen Audit Sistem</span>
          <span className="font-semibold text-slate-600">
            Halaman {pageIndex + 1} dari {totalPages}
          </span>
        </div>
      </div>

      {/* 
        Bottom Padding: 155px
        Ensures complete clearance from the bottom "Head Office" address, contact pill, and geometric banner
      */}
      <div style={{ height: '155px' }} className="shrink-0" />
    </div>
  )
}
