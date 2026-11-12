'use client'

import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, Search, CheckCircle2, Circle, Calendar, 
  Trash2, Edit, AlertCircle, Clock, Users, X, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createTask, updateTask, deleteTask } from '@/app/actions/tasks'
import { cleanHtmlText } from '@/components/calendar/dialogs/event-detail-dialog'

function getAvatarUrl(avatar: string | null | undefined) {
  if (!avatar) return ''
  if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar
  return `/avatars/${avatar}`
}

function getInitials(firstname?: string | null, lastname?: string | null) {
  const f = firstname?.replace(/\[RESIGN\]\s*/i, '').replace(/\s*\([^)]*\).*/g, '').trim() || ''
  const l = lastname?.replace(/\s*\([^)]*\).*/g, '').trim() || ''
  if (!f && !l) return 'U'
  return `${f.charAt(0)}${l ? l.charAt(0) : ''}`.toUpperCase()
}

export const TASK_STATUS_CONFIG: Record<number, { label: string; color: string; dot: string }> = {
  0: { label: 'PENDING', color: 'bg-zinc-700/80 text-zinc-100 border-zinc-600', dot: 'bg-zinc-400' },
  1: { label: 'TO DO', color: 'bg-slate-700/80 text-slate-200 border-slate-600', dot: 'bg-slate-300' },
  6: { label: 'STARTED', color: 'bg-sky-600 text-white border-sky-500', dot: 'bg-white' },
  2: { label: 'ON-PROGRESS', color: 'bg-blue-600 text-white border-blue-500 font-bold', dot: 'bg-white' },
  3: { label: 'IN REVIEW', color: 'bg-purple-600 text-white border-purple-500', dot: 'bg-white' },
  4: { label: 'REVISIONS', color: 'bg-amber-600 text-white border-amber-500', dot: 'bg-white' },
  7: { label: 'HOLD', color: 'bg-yellow-600 text-white border-yellow-500', dot: 'bg-white' },
  8: { label: 'OVERDUE', color: 'bg-rose-600 text-white border-rose-500', dot: 'bg-white' },
  5: { label: 'DONE', color: 'bg-emerald-600 text-white border-emerald-500 font-bold', dot: 'bg-white' },
}

interface ProjectTaskTableProps {
  projectId: number
  projectName: string
  tasks: any[]
  users: any[]
  isLoading?: boolean
}

export function ProjectTaskTable({
  projectId,
  projectName,
  tasks = [],
  users = [],
  isLoading = false
}: ProjectTaskTableProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Task Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskStatus, setTaskStatus] = useState<number>(1)
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssignees, setTaskAssignees] = useState<number[]>([])

  // Delete State
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)

  // Map users for fast lookup
  const userMap = useMemo(() => {
    const map = new Map<number, any>()
    users.forEach(u => map.set(u.id, u))
    return map
  }, [users])

  // Filter tasks for this project
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = 
        (task.task || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(search.toLowerCase())
      
      const matchStatus = statusFilter === 'all' || String(task.status) === statusFilter

      return matchSearch && matchStatus
    })
  }, [tasks, search, statusFilter])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string; status: number; assignees: number[]; projectId: number; dueDate?: string }) =>
      createTask(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Task berhasil ditambahkan')
        setIsDialogOpen(false)
        queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } else {
        toast.error(res.error || 'Gagal menambahkan task')
      }
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title: string; description: string; status: number; assignees: number[]; projectId: number; dueDate?: string } }) =>
      updateTask(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Task berhasil diperbarui')
        setIsDialogOpen(false)
        queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } else {
        toast.error(res.error || 'Gagal memperbarui task')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Task berhasil dihapus')
        setDeletingTaskId(null)
        queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      } else {
        toast.error(res.error || 'Gagal menghapus task')
      }
    }
  })

  // Quick toggle status between Done (5) and To Do (1)
  const handleToggleComplete = (task: any) => {
    const newStatus = task.status === 5 ? 1 : 5
    const assigneeIds = (task.assignees || []).map((a: any) => a.user_id)
    updateMutation.mutate({
      id: task.id,
      data: {
        title: task.task,
        description: task.description || '',
        status: newStatus,
        assignees: assigneeIds,
        projectId,
        dueDate: task.end_date ? new Date(task.end_date).toISOString().split('T')[0] : undefined
      }
    })
  }

  // Quick update status
  const handleQuickStatusChange = (task: any, newStatus: number) => {
    const assigneeIds = (task.assignees || []).map((a: any) => a.user_id)
    updateMutation.mutate({
      id: task.id,
      data: {
        title: task.task,
        description: task.description || '',
        status: newStatus,
        assignees: assigneeIds,
        projectId,
        dueDate: task.end_date ? new Date(task.end_date).toISOString().split('T')[0] : undefined
      }
    })
  }

  const openCreateDialog = () => {
    setEditingTask(null)
    setTaskTitle('')
    setTaskDescription('')
    setTaskStatus(1) // To Do
    setTaskDueDate('')
    setTaskAssignees([])
    setIsDialogOpen(true)
  }

  const openEditDialog = (task: any) => {
    setEditingTask(task)
    setTaskTitle(task.task || '')
    setTaskDescription(task.description || '')
    setTaskStatus(task.status ?? 1)
    setTaskDueDate(task.end_date ? new Date(task.end_date).toISOString().split('T')[0] : '')
    setTaskAssignees((task.assignees || []).map((a: any) => a.user_id))
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) {
      toast.error('Judul task wajib diisi')
      return
    }

    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: taskStatus,
      assignees: taskAssignees,
      projectId,
      dueDate: taskDueDate || undefined
    }

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleAssignee = (userId: number) => {
    setTaskAssignees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-border flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-base text-foreground tracking-wider uppercase">TASK LIST</h3>
            <span className="rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-0.5 text-xs font-bold">
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar tugas khusus untuk project <span className="font-medium text-foreground">{projectName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-xs bg-background"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Status</option>
            {Object.entries(TASK_STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>

          {/* Add Task Button (Orange as in reference screenshot) */}
          <Button 
            onClick={openCreateDialog}
            size="sm"
            className="h-9 gap-1.5 font-bold tracking-wide uppercase bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg shadow-sm px-4"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>+ ADD TASK</span>
          </Button>
        </div>
      </div>

      {/* Task List / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <th className="py-3 px-4 w-14 text-center">#</th>
              <th className="py-3 px-4 min-w-[200px]">Judul Task</th>
              <th className="py-3 px-4 min-w-[240px]">Deskripsi</th>
              <th className="py-3 px-4 w-36 text-center">Status</th>
              <th className="py-3 px-4 min-w-[140px]">Assignee</th>
              <th className="py-3 px-4 w-32">Tenggat Waktu</th>
              <th className="py-3 px-4 w-20 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span>Memuat daftar task project...</span>
                  </div>
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Clock className="size-5" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">Belum Ada Task</p>
                    <p className="text-xs text-muted-foreground">
                      {search || statusFilter !== 'all' 
                        ? 'Tidak ada task yang sesuai dengan filter pencarian.' 
                        : 'Belum ada task untuk project ini. Tambahkan task pertama sekarang.'}
                    </p>
                    {(!search && statusFilter === 'all') && (
                      <Button onClick={openCreateDialog} size="sm" variant="outline" className="mt-2 gap-1.5">
                        <Plus className="size-3.5" /> Tambah Task
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((task, idx) => {
                const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG[1]
                const isDone = task.status === 5
                const isOverdue = task.end_date && new Date(task.end_date).getTime() < Date.now() && !isDone
                const taskAssigneeList = (task.assignees || [])
                  .map((a: any) => userMap.get(a.user_id))
                  .filter(Boolean)

                return (
                  <tr 
                    key={task.id}
                    className={`hover:bg-muted/30 transition-colors group ${isDone ? 'bg-muted/10 opacity-75' : ''}`}
                  >
                    {/* Number & Complete Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-muted-foreground text-xs w-5">
                          {idx + 1}
                        </span>
                        <button
                          onClick={() => handleToggleComplete(task)}
                          title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                          className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                        >
                          {isDone ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="size-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Judul Task */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <span 
                        onClick={() => openEditDialog(task)}
                        className={`font-semibold text-foreground hover:text-primary cursor-pointer transition-colors line-clamp-1 ${isDone ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {task.task}
                      </span>
                    </td>

                    {/* Deskripsi (Italic style as in reference image) */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <span className="text-xs italic text-muted-foreground line-clamp-1">
                        {task.description ? cleanHtmlText(task.description) : '-'}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all hover:opacity-90 shadow-2xs ${statusCfg.color}`}>
                            {statusCfg.label}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36 text-xs">
                          {Object.entries(TASK_STATUS_CONFIG).map(([codeStr, cfg]) => {
                            const code = Number(codeStr)
                            return (
                              <DropdownMenuItem
                                key={code}
                                onClick={() => handleQuickStatusChange(task, code)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <span className={`size-2 rounded-full ${cfg.dot}`} />
                                <span className={task.status === code ? 'font-bold' : ''}>{cfg.label}</span>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Assignees */}
                    <td className="py-3.5 px-4">
                      {taskAssigneeList.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                      ) : (
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {taskAssigneeList.slice(0, 3).map((assignee: any) => (
                            <Avatar 
                              key={assignee.id} 
                              className="size-6 ring-2 ring-card shrink-0"
                              title={`${assignee.firstname} ${assignee.lastname || ''}`}
                            >
                              <AvatarImage 
                                src={getAvatarUrl(assignee.avatar)} 
                                alt={assignee.firstname} 
                                className="object-cover size-full"
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                {getInitials(assignee.firstname, assignee.lastname)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {taskAssigneeList.length > 3 && (
                            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
                              +{taskAssigneeList.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4">
                      {task.end_date ? (
                        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isOverdue ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}`}>
                          <Calendar className="size-3.5 shrink-0" />
                          <span>
                            {new Date(task.end_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          {isOverdue && <span className="text-[10px] uppercase font-bold text-rose-500">Overdue</span>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditDialog(task)}
                          className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Edit Task"
                        >
                          <Edit className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTaskId(task.id)}
                          className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                          title="Hapus Task"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════ CREATE / EDIT TASK DIALOG ═══════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingTask ? 'Edit Task' : 'Tambah Task Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Project: <span className="font-semibold text-foreground">{projectName}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Task Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Judul Task <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Contoh: Desain landing page hero section"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            {/* Status & Due Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {Object.entries(TASK_STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tenggat Waktu</label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Deskripsi / Detail</label>
              <textarea
                placeholder="Tuliskan catatan atau instruksi task di sini..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            {/* Assignees Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Pilih Assignee ({taskAssignees.length} dipilih)</span>
              </label>
              <div className="max-h-36 overflow-y-auto rounded-md border border-border p-2 space-y-1 bg-muted/20">
                {users.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Tidak ada user tersedia</p>
                ) : (
                  users.map((u) => {
                    const isSelected = taskAssignees.includes(u.id)
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleAssignee(u.id)}
                        className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                          isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarImage src={getAvatarUrl(u.avatar)} />
                            <AvatarFallback className="text-[10px]">{getInitials(u.firstname, u.lastname)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{u.firstname} {u.lastname}</span>
                        </div>
                        {isSelected && <span className="text-[10px] font-bold text-primary">✓</span>}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="gap-1.5"
              >
                {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                {editingTask ? 'Simpan Perubahan' : 'Buat Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DELETE CONFIRMATION DIALOG ═══════════════════ */}
      <Dialog open={deletingTaskId !== null} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Task</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus task ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingTaskId(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => deletingTaskId && deleteMutation.mutate(deletingTaskId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

