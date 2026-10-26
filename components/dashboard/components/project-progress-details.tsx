'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, PieChart as PieIcon, Calendar, CheckCircle2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

interface ProjectProgressDetailsProps {
  data: any
  selectedProjectId: number | null
  onSelectProject: (p: any) => void
}

export function ProjectProgressDetails({
  data,
  selectedProjectId,
  onSelectProject
}: ProjectProgressDetailsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const projects = data.projectProgressDetails || []

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  const legendItems = [
    { label: 'Pending', bg: 'bg-slate-800 text-white dark:bg-slate-700' },
    { label: 'Review', bg: 'bg-cyan-500 text-white' },
    { label: 'In-Progress', bg: 'bg-blue-600 text-white' },
    { label: 'OnHold', bg: 'bg-orange-500 text-white' },
    { label: 'Cancelled', bg: 'bg-rose-500 text-white' },
    { label: 'Done', bg: 'bg-emerald-600 text-white' }
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
      {/* Header with Title, Legend & Navigation Arrows */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-base text-foreground">Project Progress Details</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan status tugas untuk tiap project yang sedang berjalan
          </p>
        </div>

        {/* Status Legend Badges (Matches screenshot pill badges) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {legendItems.map((item, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide shadow-2xs ${item.bg}`}
            >
              {item.label}
            </span>
          ))}

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1 ml-auto lg:ml-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors disabled:opacity-40"
              title="Geser ke kiri"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors disabled:opacity-40"
              title="Geser ke kanan"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      {projects.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
        >
          {projects.map((proj: any) => {
            const isSelected = selectedProjectId === proj.id
            const cleanProjectName = proj.name.replace(/[‼️⏸️✅❤️💻💰⚠️]/g, '').trim()

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className={`snap-start shrink-0 w-[200px] sm:w-[220px] rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-xs'
                }`}
              >
                {/* Project Title & Tasks count */}
                <div>
                  <h3
                    className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors"
                    title={proj.name}
                  >
                    {cleanProjectName || proj.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{proj.totalTasks} Tasks</span>
                    <span className="font-semibold text-foreground">{proj.completionRate}% Done</span>
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="relative size-32 my-3 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={proj.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {proj.chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          padding: '6px 10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Donut Center Percentage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-extrabold text-foreground tracking-tight">
                      {proj.completionRate}%
                    </span>
                  </div>
                </div>

                {/* Due Date Footer */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    Due:
                  </span>
                  <span className="font-medium text-foreground">{proj.formattedDueDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-lg">
          <PieIcon className="size-7 mb-2 opacity-50" />
          <p className="text-xs font-medium">Belum ada project aktif dengan tugas terdaftar</p>
        </div>
      )}
    </div>
  )
}
