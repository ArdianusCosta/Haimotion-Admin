'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, BarChart2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

interface ProjectProgressTrendsProps {
  data: any
  range: string
  setRange: (r: string) => void
}

export function ProjectProgressTrends({ data, range, setRange }: ProjectProgressTrendsProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'status' | 'performance'>('status')

  // Line visibility toggles for status mode
  const [hiddenStatusLines, setHiddenStatusLines] = useState<Record<string, boolean>>({
    done: false,
    onProgress: false,
    pending: false,
    hold: false,
    review: false,
    cancelled: false
  })

  // Line visibility toggles for performance mode
  const [hiddenPerfLines, setHiddenPerfLines] = useState<Record<string, boolean>>({
    tasksCompleted: false,
    tasksCreated: false,
    projectsCreated: false
  })

  const toggleStatusLine = (key: string) => {
    setHiddenStatusLines(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const togglePerfLine = (key: string) => {
    setHiddenPerfLines(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const statusTrendData = data.statusTrendData || []
  const perfTrendData = data.trendData || []

  const currentData = activeTab === 'status' ? statusTrendData : perfTrendData

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-foreground">
              {activeTab === 'status' ? 'Project Progress Trends' : t('Tren Performa')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === 'status'
                ? 'Pergerakan status task (Pending, Revised, On-Progress, Overdue, Cancelled, Done)'
                : 'Perkembangan project dan task yang diselesaikan'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Status Progress vs Tren Performa */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'status'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Status Progress
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'performance'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tren Performa
          </button>
        </div>
      </div>

      {/* Chart Section */}
      {currentData.length > 0 ? (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                dy={8}
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
                itemStyle={{ padding: '2px 0' }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '4px' }}
              />

              {activeTab === 'status' ? (
                <>
                  <Legend
                    verticalAlign="top"
                    height={40}
                    iconType="circle"
                    iconSize={8}
                    onClick={(e: any) => toggleStatusLine(e.dataKey)}
                    formatter={(value, entry: any) => {
                      const isHidden = hiddenStatusLines[entry.dataKey]
                      return (
                        <span className={`text-xs cursor-pointer select-none px-1.5 transition-opacity ${
                          isHidden ? 'opacity-40 line-through' : 'text-foreground font-medium'
                        }`}>
                          {value}
                        </span>
                      )
                    }}
                  />
                  <Line
                    hide={hiddenStatusLines.pending}
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    hide={hiddenStatusLines.hold}
                    type="monotone"
                    dataKey="hold"
                    name="Hold"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    hide={hiddenStatusLines.onProgress}
                    type="monotone"
                    dataKey="onProgress"
                    name="On-Progress"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    hide={hiddenStatusLines.review}
                    type="monotone"
                    dataKey="review"
                    name="Review"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    hide={hiddenStatusLines.cancelled}
                    type="monotone"
                    dataKey="cancelled"
                    name="Cancelled"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    hide={hiddenStatusLines.done}
                    type="monotone"
                    dataKey="done"
                    name="Done"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </>
              ) : (
                <>
                  <Legend
                    verticalAlign="top"
                    height={40}
                    iconType="circle"
                    iconSize={8}
                    onClick={(e: any) => togglePerfLine(e.dataKey)}
                    formatter={(value, entry: any) => {
                      const isHidden = hiddenPerfLines[entry.dataKey]
                      return (
                        <span className={`text-xs cursor-pointer select-none px-1.5 transition-opacity ${
                          isHidden ? 'opacity-40 line-through' : 'text-foreground font-medium'
                        }`}>
                          {value}
                        </span>
                      )
                    }}
                  />
                  <Line
                    hide={hiddenPerfLines.projectsCreated}
                    type="monotone"
                    dataKey="projectsCreated"
                    name="Project Dibuat"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    hide={hiddenPerfLines.tasksCompleted}
                    type="monotone"
                    dataKey="tasksCompleted"
                    name="Task Selesai"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    hide={hiddenPerfLines.tasksCreated}
                    type="monotone"
                    dataKey="tasksCreated"
                    name="Task Dibuat"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <TrendingUp className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Belum ada data trend untuk periode ini</p>
          <p className="text-xs text-muted-foreground mt-0.5">Data akan muncul seiring penambahan task dan project</p>
        </div>
      )}
    </div>
  )
}
