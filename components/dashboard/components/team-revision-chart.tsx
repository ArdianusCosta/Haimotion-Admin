'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Users2, AlertTriangle, PlayCircle, ExternalLink, Info, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface TeamRevisionChartProps {
  data: any
}

export function TeamRevisionChart({ data }: TeamRevisionChartProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [showAllMembers, setShowAllMembers] = useState(false)

  const rawTeamData = data.teamAssignments || []
  const displayData = showAllMembers ? rawTeamData : rawTeamData.slice(0, 18)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Users2 className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-foreground uppercase tracking-wide">
              TEAM REVISION OVERVIEW & ASSIGNMENTS
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoring beban kerja dan rasio penyelesaian tugas anggota tim
            </p>
          </div>
        </div>

        {/* Legend & Toggle Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-3 rounded-xs bg-blue-500" />
              <span>Assigned</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-3 rounded-xs bg-emerald-500" />
              <span>Done</span>
            </div>
          </div>

          {rawTeamData.length > 18 && (
            <button
              type="button"
              onClick={() => setShowAllMembers(!showAllMembers)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors ml-2"
            >
              {showAllMembers ? 'Tampilkan Top 18' : `Lihat Semua (${rawTeamData.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Bar Chart Container */}
      {displayData.length > 0 ? (
        <div className="w-full overflow-x-auto pb-2">
          <div style={{ minWidth: displayData.length > 12 ? `${displayData.length * 48}px` : '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 20, right: 15, left: -10, bottom: 40 }}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                  formatter={(val: any, name: any, item: any) => {
                    return [
                      `${val} task`,
                      name === 'assigned' ? 'Ditugaskan (Assigned)' : 'Selesai (Done)'
                    ]
                  }}
                  labelFormatter={(label: any, items: any) => {
                    const item = items?.[0]?.payload
                    return item?.name ? `${item.name} (${item.role})` : label
                  }}
                />
                <Bar
                  dataKey="assigned"
                  name="assigned"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="done"
                  name="done"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-lg">
          <Users2 className="size-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">Belum ada data penugasan anggota tim</p>
        </div>
      )}

      {/* Tutorial Banner (Matches the banner from screenshot) */}
      <div
        onClick={() => setShowTutorial(true)}
        className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-xl cursor-pointer text-amber-700 dark:text-amber-400 transition-all text-xs font-semibold group shadow-2xs"
      >
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="tracking-wide">
          ⚠️ TUTORIAL VIDEO: CARA & PANDUAN INPUT OVERDUE/REVISION (KLIK DISINI)
        </span>
        <PlayCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Interactive Modal for Tutorial Video & Guide */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <PlayCircle className="size-5 text-amber-500" />
              Panduan & Standar Operasional Input Overdue / Revision
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pedoman untuk anggota tim dalam mencatat revisi dan mengelola status tugas yang melewati tenggat waktu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                1. Standar Status Revision (Revisi)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Pilih status <b>"Revisions"</b> saat ada masukan atau perbaikan dari klien atau PM. Cantumkan catatan nomor putaran revisi (misal: R1, R2) pada kolom komentar tugas.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-500" />
                2. Penanganan Tugas Overdue (Terlambat)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Tugas otomatis ditandai sebagai Overdue jika tanggal akhir (deadline) telah lewat dan status belum "Done". Segera koordinasikan dengan Project Manager untuk perpanjangan jadwal resmi.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Info className="size-4 text-blue-500" />
                3. Dokumentasi & Lampiran
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                Selalu unggah tautan hasil pekerjaan atau file revisi pada tab referensi/lampiran sebelum mengubah status kembali ke <b>"In Review"</b> atau <b>"Done"</b>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
