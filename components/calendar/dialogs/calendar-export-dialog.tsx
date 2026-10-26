'use client'

import { useState, useRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  FileSpreadsheet,
  Printer,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowUpDown,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { cleanHtmlText } from './event-detail-dialog'

interface CalendarExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: any[]
  currentDate?: Date
}

export function CalendarExportDialog({
  open,
  onOpenChange,
  events = [],
  currentDate = new Date()
}: CalendarExportDialogProps) {
  const [periodFilter, setPeriodFilter] = useState<string>('this_month')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [exportLimit, setExportLimit] = useState<number | 'all'>(50)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [previewPageIndex, setPreviewPageIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState<number>(0.72) // 0.72 scales 794x1123 to ~571x808px (perfect fit in preview)

  const printContainerRef = useRef<HTMLDivElement>(null)

  // Current active date reference
  const curYear = currentDate.getFullYear()
  const curMonth = currentDate.getMonth()

  // Filter and sort events
  const exportData = useMemo(() => {
    if (!events || events.length === 0) return []

    let filtered = [...events]

    // 1. Filter by Category/Source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((e) => {
        const s = e.source || 'calendar'
        return s === sourceFilter
      })
    }

    // 2. Filter by Period
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    if (periodFilter === 'this_month') {
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_event)
        return d.getFullYear() === curYear && d.getMonth() === curMonth
      })
    } else if (periodFilter === 'next_month') {
      const targetMonth = (curMonth + 1) % 12
      const targetYear = curMonth === 11 ? curYear + 1 : curYear
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_event)
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth
      })
    } else if (periodFilter === 'this_week') {
      const startOfWeek = new Date(todayStart)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      filtered = filtered.filter((e) => {
        const d = new Date(e.start_event)
        return d >= startOfWeek && d <= endOfWeek
      })
    } else if (periodFilter === 'today') {
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_event)
        return d >= todayStart && d <= todayEnd
      })
    } else if (periodFilter === 'upcoming') {
      filtered = filtered.filter((e) => {
        const d = new Date(e.start_event)
        return d >= todayStart
      })
    }

    // 3. Sorting
    filtered.sort((a, b) => {
      const timeA = new Date(a.start_event).getTime()
      const timeB = new Date(b.start_event).getTime()
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })

    // 4. Limit
    if (exportLimit !== 'all') {
      filtered = filtered.slice(0, exportLimit)
    }

    return filtered
  }, [events, sourceFilter, periodFilter, sortOrder, exportLimit, curYear, curMonth])

  // Pagination for A4 letterhead pages:
  // Page 1 has document header info + meta box -> comfortably fits 10 items cleanly
  // Subsequent pages fit 14 items cleanly without any clipping
  const pages = useMemo(() => {
    if (exportData.length === 0) return [[]]
    const result: any[][] = []
    const firstPageItems = 10
    const subsequentPageItems = 14

    result.push(exportData.slice(0, firstPageItems))
    let currentIdx = firstPageItems
    while (currentIdx < exportData.length) {
      result.push(exportData.slice(currentIdx, currentIdx + subsequentPageItems))
      currentIdx += subsequentPageItems
    }
    return result
  }, [exportData])

  const totalPages = Math.max(1, pages.length)

  // Current formatted date in Indonesian
  const currentDateFormatted = useMemo(() => {
    return (
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date()) + ' WIB'
    )
  }, [])

  // Period label for report
  const periodLabel = useMemo(() => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    if (periodFilter === 'this_month') return `${monthNames[curMonth]} ${curYear}`
    if (periodFilter === 'next_month') {
      const nextM = (curMonth + 1) % 12
      const nextY = curMonth === 11 ? curYear + 1 : curYear
      return `${monthNames[nextM]} ${nextY}`
    }
    if (periodFilter === 'this_week') return 'Minggu Ini'
    if (periodFilter === 'today') return 'Hari Ini'
    if (periodFilter === 'upcoming') return 'Jadwal Mendatang'
    return 'Semua Jadwal'
  }, [periodFilter, curMonth, curYear])

  // Handle PDF Export
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true)
      const toastId = toast.loading('Memproses dan merender laporan PDF resmi...')

      const { jsPDF } = await import('jspdf')
      const { toPng } = await import('html-to-image')

      const pdf = new jsPDF('p', 'mm', 'a4')

      for (let i = 0; i < pages.length; i++) {
        const pageElement = document.getElementById(`export-calendar-page-${i}`)
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
      pdf.save(`HaiMotion_Jadwal_Agenda_${dateStr}.pdf`)

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

      const excelRows = exportData.map((ev, idx) => {
        const start = new Date(ev.start_event)
        const end = new Date(ev.end_event)
        const dateFormatted = new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(start)

        const startTime = start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        const endTime = end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

        const sourceLabel = getCategoryMeta(ev.source).label

        return {
          No: idx + 1,
          Tanggal: dateFormatted,
          'Waktu Mulai': startTime,
          'Waktu Selesai': endTime,
          'Kategori / Sumber': sourceLabel,
          'Judul Agenda': cleanTitle(ev.title),
          'Deskripsi / Catatan': cleanHtmlText(ev.description) || '-'
        }
      })

      const ws = XLSX.utils.json_to_sheet(excelRows)
      ws['!cols'] = [
        { wch: 6 },
        { wch: 26 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
        { wch: 35 },
        { wch: 45 }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Jadwal & Agenda')

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      XLSX.writeFile(wb, `HaiMotion_Jadwal_Agenda_${dateStr}.xlsx`)

      toast.success('Data Excel berhasil diunduh!', { id: toastId })
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to generate Excel:', err)
      toast.error('Gagal menghasilkan Excel')
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handle iCal Export
  const handleExportIcs = () => {
    if (exportData.length === 0) {
      toast.error('Tidak ada agenda untuk diekspor')
      return
    }

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HaiMotion//Admin//EN\n'

    exportData.forEach((event: any) => {
      const start = new Date(event.start_event).toISOString().replace(/-|:|\.\d\d\d/g, '')
      const end = new Date(event.end_event).toISOString().replace(/-|:|\.\d\d\d/g, '')
      const title = cleanTitle(event.title)
      const desc = cleanHtmlText(event.description)

      icsContent += 'BEGIN:VEVENT\n'
      icsContent += `UID:${event.id}@haimotion\n`
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}\n`
      icsContent += `DTSTART:${start}\n`
      icsContent += `DTEND:${end}\n`
      icsContent += `SUMMARY:${title}\n`
      if (desc) icsContent += `DESCRIPTION:${desc}\n`
      icsContent += 'END:VEVENT\n'
    })

    icsContent += 'END:VCALENDAR'

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `haimotion-events-${new Date().toISOString().slice(0, 10)}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('File kalender (.ics) berhasil diunduh!')
    onOpenChange(false)
  }

  // Handle Direct Print
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[96vw] !max-w-[1240px] sm:!max-w-[1240px] md:!max-w-[1240px] !h-[92vh] !max-h-[92vh] p-0 overflow-hidden flex flex-col bg-background border border-border shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b flex items-center justify-between bg-card/70 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight">
                Export Jadwal & Agenda
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Pratinjau & Unduh Dokumen Resmi Kop Surat PT. Hai Motion Kreatif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-8">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <CheckCircle2 className="size-3.5" /> Template Resmi Aktif
            </span>
          </div>
        </div>

        {/* 2-Column Studio Layout Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* LEFT PANEL: Filters, Summary, and Download Actions */}
          <div className="w-full md:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-border bg-card/30 flex flex-col justify-between overflow-y-auto p-5 space-y-5">
            <div className="space-y-5">
              {/* Filter Controls Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Filter className="size-3.5 text-primary" /> Parameter Laporan
                  </span>
                  <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
                    {exportData.length} data
                  </Badge>
                </div>

                <div className="space-y-2.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
                  {/* Period Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Periode Jadwal
                    </label>
                    <select
                      value={periodFilter}
                      onChange={(e) => {
                        setPeriodFilter(e.target.value)
                        setPreviewPageIndex(0)
                      }}
                      className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    >
                      <option value="this_month">Bulan Ini ({curMonth + 1}/{curYear})</option>
                      <option value="next_month">Bulan Depan</option>
                      <option value="this_week">Minggu Ini</option>
                      <option value="today">Hari Ini</option>
                      <option value="upcoming">Jadwal Mendatang</option>
                      <option value="all">Semua Jadwal (Lengkap)</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Kategori / Sumber
                    </label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => {
                        setSourceFilter(e.target.value)
                        setPreviewPageIndex(0)
                      }}
                      className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="calendar">Kalender Event</option>
                      <option value="meeting">Meeting</option>
                      <option value="project">Project Deadline</option>
                      <option value="task">Task Deadline</option>
                      <option value="crm">CRM Follow-up</option>
                      <option value="leave">Cuti / Izin Pegawai</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Sort Order */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Urutan
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => {
                          setSortOrder(e.target.value as 'asc' | 'desc')
                          setPreviewPageIndex(0)
                        }}
                        className="w-full h-8.5 rounded-lg border border-input bg-background px-2 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                      >
                        <option value="asc">Terdekat</option>
                        <option value="desc">Terjauh</option>
                      </select>
                    </div>

                    {/* Limit */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Batas Data
                      </label>
                      <select
                        value={String(exportLimit)}
                        onChange={(e) => {
                          const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
                          setExportLimit(val)
                          setPreviewPageIndex(0)
                        }}
                        className="w-full h-8.5 rounded-lg border border-input bg-background px-2 text-xs font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                      >
                        <option value="25">25 Data</option>
                        <option value="50">50 Data</option>
                        <option value="100">100 Data</option>
                        <option value="all">Semua</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Summary Card */}
              <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2.5 shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Informasi Dokumen
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Total Agenda</span>
                    <span className="text-sm font-bold text-foreground">{exportData.length}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Halaman PDF</span>
                    <span className="text-sm font-bold text-foreground">{totalPages} Halaman</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Ukuran Kertas</span>
                    <span className="text-xs font-semibold text-foreground">A4 (210×297 mm)</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Kop Surat</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resmi Hai Motion</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="space-y-2 pt-3 border-t border-border">
              {/* Primary PDF Download Button */}
              <Button
                onClick={handleExportPdf}
                disabled={isExportingPdf || isExportingExcel || exportData.length === 0}
                className="w-full h-10 gap-2 font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
              >
                {isExportingPdf ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Unduh PDF Resmi (Kop Surat)
              </Button>

              {/* Secondary Options Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel || isExportingPdf || exportData.length === 0}
                  className="w-full h-8.5 gap-1.5 text-xs font-medium justify-center"
                >
                  {isExportingExcel ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  Excel (.xlsx)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={isExportingPdf || exportData.length === 0}
                  className="w-full h-8.5 gap-1.5 text-xs font-medium justify-center"
                >
                  <Printer className="size-3.5 text-slate-600 dark:text-slate-300" />
                  Cetak (Print)
                </Button>
              </div>

              {/* iCal Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportIcs}
                disabled={isExportingPdf || exportData.length === 0}
                className="w-full h-8 text-[11px] text-muted-foreground hover:text-foreground gap-1.5"
              >
                <CalendarDays className="size-3.5 text-blue-500" />
                Ekspor Format Kalender (.ics)
              </Button>
            </div>
          </div>

          {/* RIGHT PANEL: Live A4 Document Preview Canvas */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/5 dark:bg-black/40 overflow-hidden">
            {/* Preview Toolbar */}
            <div className="h-11 px-5 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  Pratinjau Dokumen
                </span>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-[11px] text-muted-foreground">
                  {periodLabel}
                </span>
              </div>

              {/* Zoom & Page Navigation */}
              <div className="flex items-center gap-3">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5 shadow-2xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.08).toFixed(2))))}
                    title="Zoom Out"
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <span className="text-[11px] font-mono font-medium px-1.5 min-w-[42px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0"
                    onClick={() => setZoomLevel((z) => Math.min(1.0, Number((z + 0.08).toFixed(2))))}
                    title="Zoom In"
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-[10px]"
                    onClick={() => setZoomLevel(0.72)}
                    title="Reset Zoom (Fit)"
                  >
                    <Maximize2 className="size-3" />
                  </Button>
                </div>

                {/* Page Switcher */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 bg-background rounded-lg border border-border px-1.5 py-0.5 shadow-2xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                      disabled={previewPageIndex === 0}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="text-xs font-medium px-1">
                      {previewPageIndex + 1} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      onClick={() => setPreviewPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={previewPageIndex >= totalPages - 1}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Canvas Viewport */}
            <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
              {/* Scaled Wrapper to maintain true outer dimensions */}
              <div
                style={{
                  width: `${Math.round(794 * zoomLevel)}px`,
                  height: `${Math.round(1123 * zoomLevel)}px`
                }}
                className="relative shrink-0 transition-all duration-150"
              >
                <div
                  style={{
                    width: '794px',
                    height: '1123px',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left'
                  }}
                  className="shadow-2xl rounded-sm overflow-hidden ring-1 ring-black/10"
                >
                  {renderA4CalendarPage(
                    pages[previewPageIndex] || [],
                    previewPageIndex,
                    totalPages,
                    currentDateFormatted,
                    periodLabel,
                    sourceFilter,
                    false
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 
          Offscreen container for multi-page PDF generation & direct window.print()
          Using fixed off-screen positioning instead of display:none ensures html-to-image 
          reliably calculates all dimensions, fonts, and images at true 794x1123 px scale.
        */}
        <div
          ref={printContainerRef}
          id="export-calendar-all-pages-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            pointerEvents: 'none',
            opacity: 0
          }}
        >
          {pages.map((pageEvents, pageIdx) => (
            <div key={pageIdx} id={`export-calendar-page-${pageIdx}`}>
              {renderA4CalendarPage(
                pageEvents,
                pageIdx,
                totalPages,
                currentDateFormatted,
                periodLabel,
                sourceFilter,
                true
              )}
            </div>
          ))}
        </div>

        {/* Global Print Styles for window.print() */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #export-calendar-all-pages-container,
              #export-calendar-all-pages-container * {
                visibility: visible !important;
              }
              #export-calendar-all-pages-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                opacity: 1 !important;
                width: 100% !important;
              }
              .printable-page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

// Helpers for Category & Title formatting
function cleanTitle(title?: string): string {
  if (!title) return '-'
  return title
    .replace(/^📁\s*Project:\s*/i, '')
    .replace(/^✓\s*Task:\s*/i, '')
    .replace(/^📹\s*Meeting:\s*/i, '')
    .replace(/^📞\s*Follow-up:\s*/i, '')
    .replace(/^🏖️\s*Leave:\s*/i, '')
    .trim()
}

function getCategoryMeta(source?: string) {
  switch (source) {
    case 'task':
      return {
        label: 'Task',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      }
    case 'project':
      return {
        label: 'Project',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      }
    case 'meeting':
      return {
        label: 'Meeting',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200'
      }
    case 'crm':
      return {
        label: 'CRM',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
      }
    case 'leave':
      return {
        label: 'Cuti / Izin',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
      }
    default:
      return {
        label: 'Kalender',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
      }
  }
}

// Function to render an exact A4 page with the official PT. Hai Motion Kreatif letterhead
function renderA4CalendarPage(
  pageEvents: any[],
  pageIndex: number,
  totalPages: number,
  currentDateFormatted: string,
  periodLabel: string,
  sourceFilter: string,
  isPrintMode: boolean
) {
  const isFirstPage = pageIndex === 0

  return (
    <div
      style={{
        width: '794px',
        height: '1123px',
        backgroundColor: '#ffffff'
      }}
      className={`relative text-slate-900 box-border flex flex-col font-sans select-none overflow-hidden ${
        isPrintMode ? 'printable-page-break' : ''
      }`}
    >
      {/* 
        Official Letterhead Background Image
        Cross-origin and object-fill ensure crisp pixel-perfect rendering in both PDF canvas and print
      */}
      <img
        src="/letterhead.png"
        alt="Letterhead Background"
        className="absolute inset-0 w-[794px] h-[1123px] object-fill pointer-events-none select-none z-0"
        crossOrigin="anonymous"
      />

      {/* 
        Top Padding: 160px
        Ensures complete clearance from the top geometric graphic and "Hai Motion PT. HAI MOTION KREATIF" logo
      */}
      <div style={{ height: '160px' }} className="shrink-0 relative z-10" />

      {/* Main Content Area: Padding Left 48px, Right 48px */}
      <div className="relative z-10 flex-1 px-12 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Document Header on Page 1 */}
          {isFirstPage ? (
            <div className="mb-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-3">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                    Laporan Jadwal & Agenda Kerja
                  </h1>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                    HaiMotion Integrated Schedule & Event Management System
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
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">
                    Periode:
                  </span>
                  <span className="font-semibold text-slate-800">{periodLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">
                    Kategori:
                  </span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {sourceFilter === 'all'
                      ? 'Semua Kategori'
                      : getCategoryMeta(sourceFilter).label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">
                    Dicetak Pada:
                  </span>
                  <span className="font-semibold text-slate-800">{currentDateFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase text-[9px]">
                    Klasifikasi:
                  </span>
                  <span className="font-semibold text-slate-800">Internal Operational</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between border-b pb-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">
                Laporan Jadwal & Agenda Kerja (Lanjutan)
              </span>
              <span>
                Periode: {periodLabel} · Dicetak: {currentDateFormatted}
              </span>
            </div>
          )}

          {/* Agenda Table */}
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2 px-2 text-center w-8">No</th>
                <th className="py-2 px-2.5 w-28">Tanggal</th>
                <th className="py-2 px-2 w-24 text-center">Waktu</th>
                <th className="py-2 px-2 w-20 text-center">Kategori</th>
                <th className="py-2 px-2.5 w-48">Agenda / Kegiatan</th>
                <th className="py-2 px-2.5">Keterangan / Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {pageEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Tidak ada agenda atau jadwal yang terdaftar pada periode ini.
                  </td>
                </tr>
              ) : (
                pageEvents.map((event, idx) => {
                  const globalIndex =
                    pageIndex === 0 ? idx + 1 : 10 + (pageIndex - 1) * 14 + idx + 1
                  const startDate = new Date(event.start_event)
                  const endDate = new Date(event.end_event)

                  const formattedDate = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }).format(startDate)

                  const startTime = startDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  const endTime = endDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })

                  const isSameTime = startDate.getTime() === endDate.getTime()
                  const timeDisplay = isSameTime ? startTime : `${startTime} - ${endTime}`

                  const catMeta = getCategoryMeta(event.source)
                  const cleanEventTitle = cleanTitle(event.title)
                  const cleanDesc = cleanHtmlText(event.description)

                  return (
                    <tr key={event.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-2 text-center text-slate-400 font-medium">
                        {globalIndex}
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap font-medium">
                        {formattedDate}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600 text-[9px] whitespace-nowrap">
                        {timeDisplay}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase border ${catMeta.badgeClass}`}
                        >
                          {catMeta.label}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-slate-800 leading-snug break-words">
                        {cleanEventTitle}
                      </td>
                      <td className="py-2 px-2.5 text-slate-600 font-normal leading-relaxed break-words text-[9.5px]">
                        {cleanDesc ? (
                          cleanDesc.length > 90 ? cleanDesc.slice(0, 90) + '...' : cleanDesc
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* In-content page footer info just above the letterhead bottom graphical footer */}
        <div className="pt-2 pb-1 border-t border-slate-200/70 flex items-center justify-between text-[9px] text-slate-400">
          <span>PT. Hai Motion Kreatif · Dokumen Resmi Jadwal & Agenda</span>
          <span className="font-semibold text-slate-600">
            Halaman {pageIndex + 1} dari {totalPages}
          </span>
        </div>
      </div>

      {/* 
        Bottom Padding: 155px
        Ensures complete clearance from the bottom "Head Office" address, contact pill, and geometric banner
      */}
      <div style={{ height: '155px' }} className="shrink-0 relative z-10" />
    </div>
  )
}
