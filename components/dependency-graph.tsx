'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { GitBranch, Clock, CheckCircle2, AlertCircle, Loader2, Circle, ChevronRight, ArrowRight } from 'lucide-react'

interface TaskNode {
  id: number
  task: string
  description: string
  status: number
  start_date: string | null
  end_date: string | null
  dependencies: string | null
  dependsOn: number[]
}

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string; border: string; glow: string; dot: string; colLabel: string }> = {
  0:  { label: 'Pending',     color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-600/40',  glow: '#475569', dot: '#94a3b8', colLabel: 'To Do'       },
  1:  { label: 'To Do',       color: 'text-indigo-300',  bg: 'bg-indigo-500/10',  border: 'border-indigo-600/40', glow: '#4f46e5', dot: '#818cf8', colLabel: 'To Do'       },
  2:  { label: 'In Progress', color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-600/40',   glow: '#2563eb', dot: '#60a5fa', colLabel: 'In Progress' },
  3:  { label: 'In Review',   color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-600/40', glow: '#7c3aed', dot: '#a78bfa', colLabel: 'In Review'   },
  4:  { label: 'Revisions',   color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-600/40',  glow: '#d97706', dot: '#fbbf24', colLabel: 'Revisions'   },
  5:  { label: 'Done',        color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-600/40',glow: '#059669', dot: '#34d399', colLabel: 'Done'        },
  6:  { label: 'Started',     color: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-600/40',   glow: '#0891b2', dot: '#22d3ee', colLabel: 'In Progress' },
  7:  { label: 'On Hold',     color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-600/40', glow: '#ea580c', dot: '#fb923c', colLabel: 'On Hold'     },
  8:  { label: 'Overdue',     color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-600/40',   glow: '#e11d48', dot: '#fb7185', colLabel: 'Overdue'     },
}

// Stage pipeline order
const PIPELINE_STAGES = [
  { key: 'todo',       label: 'To Do',       statuses: [0, 1],    color: '#475569', light: '#94a3b8' },
  { key: 'inprogress', label: 'In Progress', statuses: [2, 6],    color: '#2563eb', light: '#60a5fa' },
  { key: 'review',     label: 'In Review',   statuses: [3, 4],    color: '#7c3aed', light: '#a78bfa' },
  { key: 'hold',       label: 'On Hold',     statuses: [7],       color: '#ea580c', light: '#fb923c' },
  { key: 'overdue',    label: 'Overdue',     statuses: [8],       color: '#e11d48', light: '#fb7185' },
  { key: 'done',       label: 'Done',        statuses: [5],       color: '#059669', light: '#34d399' },
]

function TaskCard({ node, onClick }: { node: TaskNode; onClick: () => void }) {
  const cfg = STATUS_CONFIG[node.status] ?? STATUS_CONFIG[0]
  const isActive = node.status === 2 || node.status === 6
  const isDone = node.status === 5
  const isOverdue = node.status === 8

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-xl border bg-[#111115] p-3 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{
        borderColor: cfg.glow + '50',
        boxShadow: `0 0 0 0px ${cfg.glow}40`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${cfg.glow}60, 0 8px 24px ${cfg.glow}20` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0px transparent' }}
    >
      {/* Status Badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
          {isActive && <Loader2 className="size-2.5 animate-spin" />}
          {isDone && <CheckCircle2 className="size-2.5" />}
          {isOverdue && <AlertCircle className="size-2.5" />}
          {!isActive && !isDone && !isOverdue && <Circle className="size-2.5" />}
          {cfg.label}
        </span>
        <span className="font-mono text-[9px] text-slate-600">#{node.id}</span>
      </div>

      {/* Task Name */}
      <p className="line-clamp-2 text-xs font-medium leading-snug text-slate-200 mb-2">
        {node.task || '(No title)'}
      </p>

      {/* Due date */}
      {node.end_date && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock className="size-2.5" />
          {new Date(node.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </div>
      )}

      {/* Dependency indicator */}
      {node.dependsOn.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-600">
          <GitBranch className="size-2.5" />
          {node.dependsOn.length} dep{node.dependsOn.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Bottom glow strip */}
      <div
        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full opacity-60"
        style={{ backgroundColor: isDone ? '#34d399' : isActive ? '#60a5fa' : cfg.dot }}
      />
    </div>
  )
}

export function DependencyGraph({ tasks }: { tasks: any[] }) {
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null)

  const nodes: TaskNode[] = tasks.map(t => ({
    ...t,
    dependsOn: t.dependencies
      ? t.dependencies.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id) && id !== t.id)
      : []
  }))
  const taskMap = new Map(nodes.map(n => [n.id, n]))

  if (nodes.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-muted-foreground p-8 text-center">
        <GitBranch className="mb-4 size-10 opacity-20" />
        <p className="text-sm font-semibold">No tasks yet</p>
        <p className="mt-1 text-xs">Add tasks to this project to see the Packstub Flow.</p>
      </div>
    )
  }

  // Group tasks by pipeline stage
  const stagesWithTasks = PIPELINE_STAGES.map(stage => ({
    ...stage,
    tasks: nodes.filter(n => stage.statuses.includes(n.status))
  })).filter(s => s.tasks.length > 0)

  return (
    <div className="w-full space-y-3">
      {/* Flow Canvas */}
      <div className="overflow-x-auto rounded-xl border border-[#1e1e24] bg-[#0a0a0d]">
        <div className="flex min-w-max gap-0 p-5">
          {stagesWithTasks.map((stage, stageIdx) => (
            <div key={stage.key} className="flex items-stretch">
              {/* Stage Column */}
              <div className="flex w-[220px] flex-col gap-2">
                {/* Stage Header */}
                <div
                  className="mb-2 flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ backgroundColor: stage.color + '18', border: `1px solid ${stage.color}30` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: stage.light, boxShadow: `0 0 6px ${stage.light}` }} />
                    <span className="text-xs font-bold tracking-wide" style={{ color: stage.light }}>
                      {stage.label}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: stage.color + '30', color: stage.light }}
                  >
                    {stage.tasks.length}
                  </span>
                </div>

                {/* Task cards */}
                {stage.tasks.map(task => (
                  <TaskCard key={task.id} node={task} onClick={() => setSelectedTask(task)} />
                ))}
              </div>

              {/* Arrow connector between stages */}
              {stageIdx < stagesWithTasks.length - 1 && (
                <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1">
                  <div className="h-px w-full bg-gradient-to-r from-[#1e1e28] to-[#1e1e28] via-slate-700" />
                  <ArrowRight className="size-4 text-slate-700" />
                  <div className="h-px w-full bg-[#1e1e28]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px] text-muted-foreground">
        {stagesWithTasks.map(s => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.light }} />
            {s.label} ({s.tasks.length})
          </span>
        ))}
        {nodes.some(n => n.dependsOn.length > 0) && (
          <span className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
            <GitBranch className="size-3" />
            Click node for dependencies
          </span>
        )}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="size-4 text-muted-foreground" />
              {selectedTask?.task}
            </DialogTitle>
            <DialogDescription>Task ID: #{selectedTask?.id}</DialogDescription>
          </DialogHeader>
          {selectedTask && (() => {
            const cfg = STATUS_CONFIG[selectedTask.status] ?? STATUS_CONFIG[0]
            return (
              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {selectedTask.end_date && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      Due {new Date(selectedTask.end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {selectedTask.description && (
                  <div
                    className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: selectedTask.description || 'No description.' }}
                  />
                )}

                {selectedTask.dependsOn.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Depends On</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.dependsOn.map(depId => {
                        const dep = taskMap.get(depId)
                        const depCfg = STATUS_CONFIG[dep?.status ?? 0] ?? STATUS_CONFIG[0]
                        return (
                          <span key={depId} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${depCfg.border} ${depCfg.color} ${depCfg.bg}`}>
                            <ChevronRight className="size-3" />
                            {dep ? dep.task : `Task #${depId}`}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
