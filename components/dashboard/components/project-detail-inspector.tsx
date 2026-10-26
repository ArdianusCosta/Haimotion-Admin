'use client'

import { useRouter } from 'next/navigation'
import { Folder, ExternalLink, Plus, Users, Layers, Tag, CheckCircle2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProjectDetailInspectorProps {
  project: any
}

export function ProjectDetailInspector({ project }: ProjectDetailInspectorProps) {
  const router = useRouter()

  if (!project) return null

  const cleanName = project.name?.replace(/[‼️⏸️✅❤️💻💰⚠️]/g, '').trim() || project.name

  // 1. Task Status Data
  const statusData = (project.chartData || []).filter((d: any) => d.value > 0)

  // 2. Task Type Data (from content_pillar)
  const taskTypeColors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b']
  const taskTypeData = Object.entries(project.taskTypes || {}).map(([name, count]: [string, any], idx) => ({
    name,
    value: count,
    color: taskTypeColors[idx % taskTypeColors.length]
  })).filter(d => d.value > 0)

  // 3. Platform Data
  const platformColors = ['#3b82f6', '#10b981', '#f97316', '#a855f7', '#ec4899', '#06b6d4', '#64748b']
  const platformData = Object.entries(project.platforms || {}).map(([name, count]: [string, any], idx) => ({
    name,
    value: count,
    color: platformColors[idx % platformColors.length]
  })).filter(d => d.value > 0)

  // 4. Assignments
  const assignments: any[] = project.assignments || []

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
      {/* Header Banner with Project Name, Meta, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
            <Folder className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-orange-500" />
              <h3 className="font-bold text-base text-foreground tracking-tight">{cleanName}</h3>
              <span className="text-xs text-muted-foreground font-semibold">
                ({project.totalTasks} Tasks)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client: <span className="font-medium text-foreground">{project.client}</span> • Deadline:{' '}
              <span className="font-medium text-foreground">{project.formattedDueDate}</span> • Progress:{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{project.completionRate}% Done</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => router.push(`/projects/${project.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
          >
            <span>Buka Project</span>
            <ExternalLink className="size-3.5" />
          </button>

          {/* Legacy orange circular + button */}
          <button
            type="button"
            onClick={() => router.push(`/tasks?new=true&projectId=${project.id}`)}
            className="size-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
            title="Tambah Task Baru"
          >
            <Plus className="size-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 4 Columns Breakdown matching PHP Dashboard: Task Status, Task Type, Platform, Assignments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        
        {/* Column 1: Task Status */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="size-2 rounded-full bg-emerald-500" />
              Task Status
            </h4>

            <div className="relative size-28 mx-auto my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={48}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`status-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      padding: '4px 8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-extrabold text-foreground">{project.completionRate}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Done</span>
              <span className="font-bold text-foreground">{project.counts?.done || 0}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-600" /> In-Progress</span>
              <span className="font-bold text-foreground">{project.counts?.onProgress || 0}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-500" /> Review</span>
              <span className="font-bold text-foreground">{project.counts?.review || 0}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" /> Hold</span>
              <span className="font-bold text-foreground">{project.counts?.hold || 0}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-500" /> Pending</span>
              <span className="font-bold text-foreground">{project.counts?.pending || 0}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Task Type */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <Tag className="size-3.5 text-amber-500" />
              Task Type
            </h4>

            {taskTypeData.length > 0 ? (
              <div className="relative size-28 mx-auto my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      dataKey="value"
                      stroke="none"
                    >
                      {taskTypeData.map((entry: any, index: number) => (
                        <Cell key={`type-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        padding: '4px 8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">
                Tipe tugas umum
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs pt-2 border-t border-border/50 max-h-[120px] overflow-y-auto no-scrollbar">
            {taskTypeData.length > 0 ? (
              taskTypeData.slice(0, 5).map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-muted-foreground truncate">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="truncate">{t.name}</span>
                  </span>
                  <span className="font-bold text-foreground shrink-0 ml-1">{t.value}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground">General</span>
            )}
          </div>
        </div>

        {/* Column 3: Platform */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <Layers className="size-3.5 text-blue-500" />
              Platform
            </h4>

            {platformData.length > 0 ? (
              <div className="relative size-28 mx-auto my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      dataKey="value"
                      stroke="none"
                    >
                      {platformData.map((entry: any, index: number) => (
                        <Cell key={`platform-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        padding: '4px 8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">
                Platform umum
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs pt-2 border-t border-border/50 max-h-[120px] overflow-y-auto no-scrollbar">
            {platformData.length > 0 ? (
              platformData.slice(0, 5).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-muted-foreground truncate">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="font-bold text-foreground shrink-0 ml-1">{p.value}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground">General</span>
            )}
          </div>
        </div>

        {/* Column 4: Assignments */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="size-3.5 text-emerald-500" />
                Assignments
              </h4>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {assignments.length} Anggota
              </span>
            </div>

            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {assignments.length > 0 ? (
                assignments.map((m: any) => {
                  const initials = m.name
                    ? m.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'U'

                  return (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="size-6 shrink-0 ring-1 ring-border">
                          <AvatarImage src={m.avatar} alt={m.name} />
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{m.role}</p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {m.tasksCount} task
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Users className="size-6 mb-1 opacity-40" />
                  <p className="text-xs">Belum ada anggota ditugaskan</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Total Beban Tugas:</span>
            <span className="font-bold text-foreground">{project.totalTasks} tugas</span>
          </div>
        </div>

      </div>
    </div>
  )
}
