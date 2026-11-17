import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  ChevronRight, Users, 
  Clock, CalendarDays, ClipboardList, Trash2, Edit, 
  ChevronLeft, Lock, X, Copy, Archive, MoreVertical, RotateCcw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { TaskStatusCard } from './task-status-card'
import { ProjectTeamKpi } from './project-team-kpi'
import { deeplyDecodeHTML } from '../utils/html-helpers'
import { STATUS_LABELS } from './project-list-view'
import { ProjectFormDialog } from '@/components/project-form-dialog'
import { ProjectContributorsDialog } from '@/components/project-contributors-dialog'
import { ProjectDomainChecker } from './project-domain-checker'
import { ProjectTaskTable } from './project-task-table'

export function ProjectDetailView({
  selectedProject, setSelectedProjectId,
  toggleFavorite, setIsFormOpen, setIsDeleteDialogOpen,
  duplicateMutation, setIsArchiveDialogOpen, exportMutation,
  isDetailLoading, detailTasks, projectDetailRes,
  isKpiDialogOpen, setIsKpiDialogOpen,
  isContributorsOpen, setIsContributorsOpen,
  isFormOpen, isDeleteDialogOpen, deleteMutation,
  isArchiveDialogOpen, archiveMutation, unarchiveMutation, users,
  onEditProject
}: any) {
  const router = useRouter()

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-2 pb-24">
        
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-3.5" /> Projects
            </button>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-foreground">{selectedProject.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none"
              title="More options"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem 
                onClick={() => onEditProject ? onEditProject() : setIsFormOpen(true)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 size-4" />
                <span>Edit Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => duplicateMutation.mutate(selectedProject.id)}
                disabled={duplicateMutation?.isPending}
                className="cursor-pointer"
              >
                <Copy className="mr-2 size-4" />
                <span>Duplicate Project</span>
              </DropdownMenuItem>
              {selectedProject.is_archived ? (
                <DropdownMenuItem 
                  onClick={() => unarchiveMutation?.mutate(selectedProject.id)}
                  disabled={unarchiveMutation?.isPending}
                  className="cursor-pointer text-amber-600 focus:text-amber-600"
                >
                  <RotateCcw className="mr-2 size-4" />
                  <span>Pulihkan dari Arsip</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => setIsArchiveDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Archive className="mr-2 size-4" />
                  <span>Archive Project</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ═══════════════════ ARCHIVED BANNER ═══════════════════ */}
        {selectedProject.is_archived && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-600 dark:text-amber-400">
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <Archive className="size-5 shrink-0" />
              <div>
                <p className="font-semibold">Project ini sedang diarsipkan</p>
                <p className="text-xs text-muted-foreground">Project tidak tampil di daftar utama dan bisa dipulihkan kapan saja.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 gap-1.5 text-xs border-amber-500/40 hover:bg-amber-500/20 text-foreground cursor-pointer"
              onClick={() => unarchiveMutation?.mutate(selectedProject.id)}
              disabled={unarchiveMutation?.isPending}
            >
              <RotateCcw className="size-3.5" />
              {unarchiveMutation?.isPending ? 'Memulihkan...' : 'Pulihkan Project'}
            </Button>
          </div>
        )}

        {/* ═══════════════════ PROJECT DETAILS CARD ═══════════════════ */}
        <div className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project Details</p>
              <h1 className="truncate text-xl font-bold tracking-tight">{selectedProject.name}</h1>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_LABELS[selectedProject.status]?.color ?? 'bg-muted text-muted-foreground'}`}>
              {STATUS_LABELS[selectedProject.status]?.label ?? `Status ${selectedProject.status}`}
            </span>
          </div>

          {selectedProject.description && (
            <div
              className="mb-5 line-clamp-3 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: deeplyDecodeHTML(selectedProject.description) }}
            />
          )}

          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project Manager</p>
              {selectedProject.manager ? (
                <div className="flex items-center gap-2">
                  {selectedProject.manager.avatar ? (
                    <img src={selectedProject.manager.avatar} className="size-7 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {selectedProject.manager.firstname?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium leading-tight">{selectedProject.manager.firstname} {selectedProject.manager.lastname}</p>
                    <p className="text-[11px] font-medium text-primary">Project Manager</p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Unassigned</span>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Start Date</p>
              <div className="flex items-center gap-1.5">
                <div className="flex size-6 items-center justify-center rounded bg-blue-500/10">
                  <CalendarDays className="size-3.5 text-blue-500" />
                </div>
                <span className="text-sm font-medium">
                  {selectedProject.start_date
                    ? new Date(selectedProject.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">End Date</p>
              <div className="flex items-center gap-1.5">
                <div className="flex size-6 items-center justify-center rounded bg-rose-500/10">
                  <CalendarDays className="size-3.5 text-rose-500" />
                </div>
                <span className="text-sm font-medium">
                  {selectedProject.end_date
                    ? new Date(selectedProject.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold">Overall Progress</p>
              <span className="text-2xl font-bold tracking-tight text-primary">
                {selectedProject.stats?.progress || 0}<span className="text-sm font-medium text-muted-foreground">%</span>
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700 ease-out"
                style={{ width: `${selectedProject.stats?.progress || 0}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Total{' '}
              <span className="font-semibold text-foreground">{selectedProject.stats?.completedTasks || 0}</span>{' '}of{' '}
              <span className="font-semibold text-foreground">{selectedProject.stats?.totalTasks || 0}</span>{' '}tasks completed
            </p>
          </div>

          {/* ═══════════════════ CONTRIBUTORS SECTION ═══════════════════ */}
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Contributors</h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {(selectedProject.members?.length || 0) + (selectedProject.manager ? 1 : 0)}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsContributorsOpen(true)}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <Users className="size-3.5" />
                Manage Contributors
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {selectedProject.manager && (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <Avatar className="size-9 ring-1 ring-primary/30 shrink-0">
                    <AvatarImage
                      src={getAvatarUrl(selectedProject.manager.avatar)}
                      alt={selectedProject.manager.firstname || 'Manager'}
                      className="object-cover size-full"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(selectedProject.manager.firstname, selectedProject.manager.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-foreground">
                      {selectedProject.manager.firstname} {selectedProject.manager.lastname}
                    </p>
                    <span className="inline-block text-[10px] font-semibold text-primary">
                      Project Manager
                    </span>
                  </div>
                </div>
              )}

              {selectedProject.members?.map((member: any) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <Avatar className="size-9 ring-1 ring-border shrink-0">
                    <AvatarImage
                      src={getAvatarUrl(member.avatar)}
                      alt={member.firstname || 'Member'}
                      className="object-cover size-full"
                    />
                    <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                      {getInitials(member.firstname, member.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate text-foreground">
                      {member.firstname} {member.lastname}
                    </p>
                    <span className="inline-block text-[10px] text-muted-foreground">
                      Member
                    </span>
                  </div>
                </div>
              ))}

              {(!selectedProject.manager && (!selectedProject.members || selectedProject.members.length === 0)) && (
                <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                  Belum ada contributor yang ditambahkan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════ PROJECT STATISTICS ═══════════════════ */}
        <div className="mb-5">
          <h3 className="mb-3 font-semibold">Project Statistics</h3>
          <div className="flex flex-col gap-4">

            <TaskStatusCard stats={selectedProject.stats || { pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, totalTasks: 0 }} />

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6 flex items-center justify-between">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Team KPI
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-blue-500" /> Assigned</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-full bg-emerald-500" /> Done</span>
                </div>
              </div>
              <div className="px-2 sm:px-8">
                {isDetailLoading ? (
                  <div className="flex flex-col gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="flex w-44 sm:w-52 items-center gap-3 shrink-0 min-w-0">
                          <div className="size-8 shrink-0 min-w-8 min-h-8 aspect-square rounded-full bg-muted" />
                          <div className="h-3 w-20 rounded bg-muted" />
                        </div>
                        <div className="flex-1 border-l border-border/50 pl-4 flex flex-col gap-2">
                          <div className="h-2 w-full rounded-full bg-muted" />
                          <div className="h-2 w-3/4 rounded-full bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ProjectTeamKpi kpiData={projectDetailRes?.data?.memberKpi ?? []} />
                )}
              </div>
              <button
                onClick={() => setIsKpiDialogOpen(true)}
                className="mt-6 flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-border bg-muted/20 px-3 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-accent"
              >
                View Full Team Report <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════ PROJECT TASKS TABLE ═══════════════════ */}
        <ProjectTaskTable 
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          tasks={(projectDetailRes?.data?.tasks as any[]) || detailTasks || []}
          users={users}
          isLoading={isDetailLoading}
        />

        {/* ═══════════════════ DOMAIN CHECKER ═══════════════════ */}
        <div className="mb-5">
          <ProjectDomainChecker defaultDomain={/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(selectedProject.name || '') ? selectedProject.name : ''} />
        </div>
      </div>

      <ProjectContributorsDialog 
        open={isContributorsOpen} 
        onOpenChange={setIsContributorsOpen} 
        project={selectedProject} 
        allUsers={users} 
      />
      <ProjectFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        project={selectedProject}
        users={users} 
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedProject.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(selectedProject.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Project <strong>{selectedProject.name}</strong> akan disembunyikan dari daftar aktif. Kamu bisa mengembalikannya nanti jika diperlukan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)} disabled={archiveMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={archiveMutation.isPending}
              onClick={() => {
                archiveMutation.mutate(selectedProject.id)
                setIsArchiveDialogOpen(false)
              }}
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isKpiDialogOpen} onOpenChange={setIsKpiDialogOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 border-0 overflow-hidden [&>button]:hidden">
          <div id="team-kpi-report" className="bg-background">
            <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="size-4" />
                <span>Team KPI — Full List</span>
              </div>
              <button onClick={() => setIsKpiDialogOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="px-6 py-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold">Team KPI Report</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Project: {selectedProject.name}
                </p>
              </div>

            <div className="max-h-[400px] overflow-y-auto pr-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-2 font-semibold text-[10px] uppercase text-muted-foreground">NO</th>
                    <th className="py-3 px-2 font-semibold text-[10px] uppercase text-muted-foreground">TEAM MEMBER</th>
                    <th className="py-3 px-2 font-semibold text-[10px] uppercase text-muted-foreground text-center">ASSIGNED</th>
                    <th className="py-3 px-2 font-semibold text-[10px] uppercase text-muted-foreground text-center">DONE</th>
                    <th className="py-3 px-2 font-semibold text-[10px] uppercase text-muted-foreground w-[200px]">COMPLETION</th>
                  </tr>
                </thead>
                <tbody>
                  {(projectDetailRes?.data?.memberKpi ?? (selectedProject.members?.map((m: any) => ({ userId: m.id, name: `${m.firstname} ${m.lastname || ''}`.trim(), assigned: 0, done: 0 })) || [])).map((kpi: any, i: number) => {
                    const completion = kpi.assigned > 0 ? Math.round((kpi.done / kpi.assigned) * 100) : 0;
                    
                    return (
                      <tr key={kpi.userId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-2 font-medium">{i + 1}</td>
                        <td className="py-4 px-2">
                          <p className="font-medium text-sm">{kpi.name}</p>
                        </td>
                        <td className="py-4 px-2 text-center">{kpi.assigned}</td>
                        <td className="py-4 px-2 text-center">{kpi.done}</td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div 
                                className="h-full bg-primary transition-all duration-500" 
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">{completion}% Complete</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            </div>
          </div>
          
          <div className="px-6 pb-6 pt-0 bg-background">
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsKpiDialogOpen(false)}>
                CLOSE
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={async () => {
                try {
                  const toastId = toast.loading('Generating PDF...')
                  const { jsPDF } = await import('jspdf')
                  const { toPng } = await import('html-to-image')
                  
                  const element = document.getElementById('team-kpi-report')
                  if (!element) throw new Error('Element not found')

                  const imgData = await toPng(element, { pixelRatio: 2 })
                  
                  const pdf = new jsPDF('p', 'mm', 'a4')
                  const pdfWidth = pdf.internal.pageSize.getWidth()
                  const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth
                  
                  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                  pdf.save(`Team_KPI_${selectedProject.name.replace(/\s+/g, '_')}.pdf`)
                  
                  toast.success('PDF generated successfully!', { id: toastId })
                } catch (error) {
                  console.error(error)
                  toast.error('Failed to generate PDF')
                }
              }}>
                SAVE AS PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
