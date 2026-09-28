'use client'

import { useState, useEffect } from 'react'
import { getAdvancedAnalytics } from '@/app/actions/analytics'
import { ArrowDownRight, ArrowUpRight, Download, Users, Briefcase, Clock, ShieldAlert, BarChart3, AlertCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts'
import { useLanguage } from '@/components/language-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AnalyticsPage() {
  const { t } = useLanguage()
  const [range, setRange] = useState('Last 30 days')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    getAdvancedAnalytics(range).then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [range])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Menganalisis data...</p>
        </div>
      </div>
    )
  }

  if (!data) return <div>Failed to load analytics.</div>

  const totalOverloaded = data.teamWorkload.filter((u: any) => u.status === 'Overload').length
  const totalClients = data.clientHealth.length
  const averageHealth = data.clientHealth.length > 0 
    ? Math.round(data.clientHealth.reduce((acc: number, c: any) => acc + c.healthScore, 0) / data.clientHealth.length) 
    : 0

  return (
    <div className="flex flex-col gap-7 pb-10">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace</span><span>/</span><span className="text-foreground">Advanced Analytics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Kapasitas & Klien</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Monitor beban kerja tim dan evaluasi performa klien untuk pengambilan keputusan taktis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px] h-10 bg-background">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Last 7 days">7 Hari Terakhir</SelectItem>
              <SelectItem value="Last 30 days">30 Hari Terakhir</SelectItem>
              <SelectItem value="This year">Tahun Ini</SelectItem>
              <SelectItem value="All time">Semua Waktu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* QUICK KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tim Overload</span>
            <span className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10"><Users className="size-4 text-rose-500" /></span>
          </div>
          <p className="mt-5 text-2xl font-bold tracking-tight">{totalOverloaded} Orang</p>
          <p className="mt-2 text-xs text-muted-foreground">Membutuhkan pendelegasian ulang</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Klien Aktif</span>
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10"><Briefcase className="size-4 text-primary" /></span>
          </div>
          <p className="mt-5 text-2xl font-bold tracking-tight">{totalClients} Klien</p>
          <p className="mt-2 text-xs text-muted-foreground">Di periode ini</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Skor Kesehatan Klien (Rata-rata)</span>
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10"><BarChart3 className="size-4 text-emerald-500" /></span>
          </div>
          <p className="mt-5 text-2xl font-bold tracking-tight">{averageHealth}/100</p>
          <p className="mt-2 text-xs text-muted-foreground">Berdasarkan delay & revisi</p>
        </div>
      </div>

      {/* TEAM UTILIZATION & WORKLOAD */}
      <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-lg">Beban Kerja & Kapasitas Tim</h2>
            <p className="mt-1 text-xs text-muted-foreground">Perbandingan Jam Kerja Tercatat (Log) vs Kapasitas Normal</p>
          </div>
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={data.teamWorkload} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
              <RechartsTooltip 
                cursor={{fill: 'var(--muted)', opacity: 0.4}}
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="hoursLogged" radius={[4, 4, 0, 0]} name="Jam Kerja (Logged)">
                {data.teamWorkload.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.status === 'Overload' ? 'var(--destructive)' : entry.status === 'Underutilized' ? 'var(--chart-4)' : 'var(--primary)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-medium">Anggota Tim</th>
                <th className="pb-3 font-medium text-center">Task Aktif</th>
                <th className="pb-3 font-medium text-center">Jam Kerja (Log)</th>
                <th className="pb-3 font-medium text-center">Status Beban</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.teamWorkload.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="py-3 flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary font-medium text-xs">{user.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </td>
                  <td className="py-3 text-center">{user.activeTasks}</td>
                  <td className="py-3 text-center">{user.hoursLogged} <span className="text-xs text-muted-foreground">/ {user.capacity}h</span></td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border
                      ${user.status === 'Overload' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        user.status === 'Underutilized' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CLIENT HEALTH LEADERBOARD */}
      <section className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-lg">Leaderboard Kesehatan Klien</h2>
            <p className="mt-1 text-xs text-muted-foreground">Evaluasi klien berdasarkan tingkat delay dan revisi</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-medium">Klien</th>
                <th className="pb-3 font-medium text-center">Total Project</th>
                <th className="pb-3 font-medium text-center">Tingkat Revisi</th>
                <th className="pb-3 font-medium text-center">Tingkat Keterlambatan</th>
                <th className="pb-3 font-medium text-center">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.clientHealth.map((client: any, idx: number) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="py-4 font-medium">{client.name}</td>
                  <td className="py-4 text-center">{client.totalProjects}</td>
                  
                  {/* Revision Rate */}
                  <td className="py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-semibold ${client.revisionRate > 20 ? 'text-rose-500' : 'text-foreground'}`}>
                        {client.revisionRate}%
                      </span>
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${client.revisionRate > 20 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${client.revisionRate}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Delay Rate */}
                  <td className="py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-semibold ${client.delayRate > 20 ? 'text-rose-500' : 'text-foreground'}`}>
                        {client.delayRate}%
                      </span>
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${client.delayRate > 20 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${client.delayRate}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Health Score */}
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border
                      ${client.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        client.healthScore >= 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'}`}>
                      {client.healthScore}/100
                    </span>
                  </td>
                </tr>
              ))}
              
              {data.clientHealth.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada data klien untuk periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
