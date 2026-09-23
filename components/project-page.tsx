
'use client'

import { useState } from 'react'
import { 
  ChevronRight, Star, Share2, MoreHorizontal, Users, Settings, 
  FileText, Link2, GitBranch, Clock, Info, CalendarDays, 
  CheckCircle, File, Lightbulb, ClipboardList, Plus, Search, Filter, 
  Trash2, Edit, ChevronLeft, Loader2, Lock, Download, X
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProjectById, deleteProject, toggleFavoriteProject, archiveProject, duplicateProject, exportProjectData } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'
import { DependencyGraph } from '@/components/dependency-graph'
import { ProjectContributorsDialog } from '@/components/project-contributors-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectFormDialog } from '@/components/project-form-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


function deeplyDecodeHTML(html: string) {
  if (!html) return '';
  let prev = '';
  let curr = html;
  // Decode up to 5 times to handle deeply nested escapes
  let maxIters = 5;
  while (prev !== curr && maxIters > 0) {
    prev = curr;
    curr = curr
         .replace(/&amp;/gi, "&")
         .replace(/&lt;/gi, "<")
         .replace(/&gt;/gi, ">")
         .replace(/&quot;/gi, '"')
         .replace(/&#039;/gi, "'")
         .replace(/&nbsp;/gi, " ");
    maxIters--;
  }
  return curr;
}

function stripHtmlTags(html: string) {
  let decoded = html;
  if (!decoded) return '';
  let iters = 10;
  while (iters > 0) {
    let prev = decoded;
    decoded = decoded.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#039;/gi, "'").replace(/&nbsp;/gi, " ");
    if (prev === decoded) break;
    iters--;
  }
  return decoded.replace(/<[^>]*>?/gm, '').trim();
}

// ─── Chart helper constants ────────────────────────────────────────────────
const CHART_COLORS = [
  '#3b82f6','#ef4444','#f59e0b','#22c55e','#a855f7',
  '#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6',
]

// ─── Donut chart component ──────────────────────────────────────────────────
function ProjectDonutChart({ segments, total }: { segments: { pct: number; color: string }[]; total: number }) {
  const r = 42, cx = 60, cy = 60
  const C = 2 * Math.PI * r
  let cum = 0
  const validSegs = segments.filter(s => s.pct > 0)
  return (
    <div className="relative mx-auto flex size-[120px] items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth={20} />
        {validSegs.map((seg, i) => {
          const dashArr = `${seg.pct * C} ${C}`
          const dashOff = -(cum * C)
          cum += seg.pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={20}
              strokeDasharray={dashArr} strokeDashoffset={dashOff}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          )
        })}
      </svg>
      <div className="relative flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold">{total}</span>
        <span className="text-[10px] text-muted-foreground">tasks</span>
      </div>
    </div>
  )
}

// ─── Team KPI bar chart ─────────────────────────────────────────────────────
function ProjectTeamKpi({ kpiData }: { kpiData: { userId: number; name: string; avatar: string; assigned: number; done: number }[] }) {
  if (!kpiData || !kpiData.length) {
    return <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No team members assigned</div>
  }

  const sorted = [...kpiData].sort((a,b) => b.assigned - a.assigned).slice(0, 5)
  const maxVal = Math.max(...sorted.map(d => d.assigned), 1)

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((d, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex w-36 items-center gap-3 shrink-0">
             <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
               {d.avatar}
             </div>
             <span className="text-sm font-medium truncate" title={d.name}>{d.name}</span>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-2 border-l border-border/50 pl-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-blue-500 font-semibold w-[60px]">Assigned</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(d.assigned / maxVal) * 100}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{d.assigned}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-500 font-semibold w-[60px]">Done</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(d.done / maxVal) * 100}%` }} />
              </div>
              <span className="font-bold w-6 text-right">{d.done}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Task Status Card ───────────────────────────────────────────────────────
function TaskStatusCard({ stats }: { stats: any }) {
  const [hidden, setHidden] = useState<string[]>([])
  const toggle = (label: string) => setHidden(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  const items = [
    { label: 'Pending',     color: '#6b7280', val: stats.pendingTasks, desc: 'Not started yet' },
    { label: 'In Progress', color: '#3b82f6', val: stats.inProgressTasks, desc: 'Currently working on' },
    { label: 'Done',        color: '#22c55e', val: stats.completedTasks, desc: 'Successfully completed' },
  ]
  
  const visibleItems = items.filter(item => !hidden.includes(item.label))
  const visibleTotal = visibleItems.reduce((acc, curr) => acc + curr.val, 0)
  
  const segments = items.map(item => ({
    pct: !hidden.includes(item.label) && visibleTotal > 0 ? item.val / visibleTotal : 0,
    color: item.color
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-semibold text-foreground flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500" />
          Task Status
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{stats.totalTasks} total tasks</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-8 px-2 sm:px-8">
        <div className="shrink-0 relative">
          <ProjectDonutChart total={visibleTotal} segments={segments} />
        </div>
        <div className="w-full flex-1 grid grid-cols-2 gap-4">
          {items.map(item => {
            const isHidden = hidden.includes(item.label);
            return (
              <div 
                key={item.label} 
                onClick={() => toggle(item.label)}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${isHidden ? 'border-transparent bg-muted/10 opacity-50' : 'border-border/50 bg-muted/20 hover:bg-muted/50'}`}
              >
                <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: isHidden ? '#ccc' : item.color }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{item.label}</span>
                    <span className="font-bold text-base ml-auto">{item.val}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Task Type Card ─────────────────────────────────────────────────────────
function TaskTypeCard({ detailTasks, isLoading }: { detailTasks: any[], isLoading: boolean }) {
  const [hidden, setHidden] = useState<string[]>([])
  const toggle = (label: string) => setHidden(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])
  
  const typeGroups: Record<string, number> = {}
  detailTasks.forEach((t: any) => {
    const k = t.type || 'General'
    typeGroups[k] = (typeGroups[k] || 0) + 1
  })
  
  const entries = Object.entries(typeGroups)
  const items = entries.map(([label, count], i) => ({
    label,
    count,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }))
  
  const visibleItems = items.filter(item => !hidden.includes(item.label))
  const visibleTotal = visibleItems.reduce((acc, curr) => acc + curr.count, 0)
  
  const segments = items.map(item => ({
    pct: !hidden.includes(item.label) && visibleTotal > 0 ? item.count / visibleTotal : 0,
    color: item.color
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-semibold text-foreground flex items-center gap-2">
          <span className="size-2 rounded-full bg-purple-500" />
          Task Type Distribution
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{detailTasks.length} tasks</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-8 px-2 sm:px-8">
        <div className="shrink-0">
          <ProjectDonutChart total={visibleTotal} segments={segments} />
        </div>
        <div className="w-full flex-1 max-h-[140px] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
              {isLoading ? 'Loading...' : 'No type data available.'}
            </p>
          ) : items.map((item) => {
            const isHidden = hidden.includes(item.label);
            return (
              <div 
                key={item.label} 
                onClick={() => toggle(item.label)}
                className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-colors ${isHidden ? 'border-transparent bg-muted/10 opacity-50' : 'border-border/50 bg-muted/20 hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: isHidden ? '#ccc' : item.color }} />
                  <span className="truncate text-sm font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-sm bg-background px-2 py-0.5 rounded-md border border-border/50">{item.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ProjectPage() {
  const STATUS_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: 'On Hold', color: 'bg-amber-500/10 text-amber-600' },
    1: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
    2: { label: 'Active', color: 'bg-blue-500/10 text-blue-600' },
    5: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600' },
    6: { label: 'In Review', color: 'bg-purple-500/10 text-purple-600' },
  }
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('Dependencies')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isContributorsOpen, setIsContributorsOpen] = useState(false)
  const [isKpiDialogOpen, setIsKpiDialogOpen] = useState(false)
  const router = useRouter()
  
  const queryClient = useQueryClient()
  
  const { data: projectsRes, isLoading, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  })
  
  const toggleFavorite = useMutation({
    mutationFn: toggleFavoriteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  })
  const archiveMutation = useMutation({
    mutationFn: archiveProject,
    onSuccess: () => {
      toast.success('Project archived successfully')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSelectedProjectId(null)
    }
  })
  const duplicateMutation = useMutation({
    mutationFn: duplicateProject,
    onSuccess: (res) => {
      if(res.success && res.data) {
        toast.success('Project duplicated successfully')
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        setSelectedProjectId(res.data.id)
      } else toast.error('Failed to duplicate')
    }
  })
  const exportMutation = useMutation({
    mutationFn: exportProjectData,
    onSuccess: (res) => {
      if(res.success) {
        toast.success('Project exported successfully')
        // Create a blob and download
        const blob = new Blob([res.data ?? ''], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename ?? 'export.json'
        a.click()
      } else toast.error('Failed to export')
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Project deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        setSelectedProjectId(null)
        setIsDeleteDialogOpen(false)
      } else {
        toast.error(res.error || 'Failed to delete project')
      }
    }
  })

  const projects = projectsRes?.data || []
  const users = projectsRes?.users || []
  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === null || p.status === statusFilter))
  
  if (projectsError) {
    console.error("Projects Fetch Error:", projectsError)
  }
  
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null

  // ─── Fetch full task details for selected project ─────────────────────────
  const { data: projectDetailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: ['project-detail', selectedProjectId],
    queryFn: () => getProjectById(selectedProjectId!),
    enabled: !!selectedProjectId,
    staleTime: 30_000,
  })
  const detailTasks = (projectDetailRes?.data?.tasks as any[]) ?? []

  // Render List View
  if (!selectedProjectId) {
    return (
      <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col gap-6 overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all your active projects and deliverables.</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="size-4" /> 
                  {statusFilter === null ? 'Filter' : statusFilter === 2 ? 'Active' : statusFilter === 5 ? 'Done' : statusFilter === 0 ? 'On Hold' : 'Pending'}
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem checked={statusFilter === null} onCheckedChange={() => setStatusFilter(null)}>All Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 2} onCheckedChange={() => setStatusFilter(2)}>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 1} onCheckedChange={() => setStatusFilter(1)}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 0} onCheckedChange={() => setStatusFilter(0)}>On Hold</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 5} onCheckedChange={() => setStatusFilter(5)}>Completed</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="h-9 gap-2" onClick={() => setIsFormOpen(true)}>
              <Plus className="size-4" /> New Project
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm pl-9" 
          />
        </div>

        <div className="flex-1 overflow-y-auto pb-8 pr-2">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
              <ClipboardList className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No projects found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or create a new project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => setSelectedProjectId(project.id)}
                  className="group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors" title={project.name}>{project.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={stripHtmlTags(project.description)}>
                        {stripHtmlTags(project.description)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_LABELS[project.status]?.color ?? 'bg-muted text-muted-foreground'}`}>
                        {STATUS_LABELS[project.status]?.label ?? `Status ${project.status}`}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">{project.stats.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${project.stats.progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {project.stats.completedTasks} / {project.stats.totalTasks} Tasks Completed
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        Due: {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex -space-x-2">
                      {project.manager && (
                         <div 
                          className="relative flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] font-medium text-foreground"
                          title={`PM: ${project.manager.firstname}`}
                         >
                            {project.manager.firstname.charAt(0)}
                            <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-primary" />
                         </div>
                      )}
                      {project.members.slice(0, 3).map((member: any, i: number) => (
                        <div 
                          key={member.id}
                          className="flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] font-medium text-foreground"
                          title={member.firstname}
                        >
                          {member.firstname.charAt(0)}
                        </div>
                      ))}
                      {project.members.length > 3 && (
                        <div className="flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[9px] font-medium text-foreground">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <ProjectFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          users={users} 
        />
      </div>
    )
  }

  // Detail View
  if (!selectedProject) return null;

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col gap-6 overflow-hidden lg:flex-row">
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
          <div className="flex items-center gap-2">
            <button onClick={() => toggleFavorite.mutate(selectedProject.id)} className={`flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground ${selectedProject.is_favorite ? 'text-amber-500' : 'text-muted-foreground'}`}>
              <Star className="size-4" />
            </button>
            <button onClick={() => {
    navigator.clipboard.writeText(window.location.origin + '/projects/' + selectedProject.id)
    toast.success('Project link copied.')
  }} className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground text-foreground">
              <Share2 className="size-4" /> <span className="hidden sm:inline">Share</span>
            </button>
            <button 
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => setIsFormOpen(true)}
            >
              <Edit className="size-4" />
            </button>
            <button 
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-destructive hover:text-destructive text-muted-foreground"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="size-4" />
                </button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => duplicateMutation.mutate(selectedProject.id)}>Duplicate project</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsArchiveDialogOpen(true)}>Archive project</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportMutation.mutate(selectedProject.id)}>Export project data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ═══════════════════ PROJECT DETAILS CARD ═══════════════════ */}
        <div className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          {/* Header: name + status */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project Details</p>
              <h1 className="truncate text-xl font-bold tracking-tight">{selectedProject.name}</h1>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_LABELS[selectedProject.status]?.color ?? 'bg-muted text-muted-foreground'}`}>
              {STATUS_LABELS[selectedProject.status]?.label ?? `Status ${selectedProject.status}`}
            </span>
          </div>

          {/* Description */}
          {selectedProject.description && (
            <div
              className="mb-5 line-clamp-3 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: deeplyDecodeHTML(selectedProject.description) }}
            />
          )}

          {/* Info grid: Manager | Start | End */}
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project Manager</p>
              {selectedProject.manager ? (
                <div className="flex items-center gap-2">
                  {selectedProject.manager.avatar ? (
                    <img src={selectedProject.manager.avatar} className="size-7 rounded-full object-cover border border-border" alt="" />
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {selectedProject.manager.firstname.charAt(0)}
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


          {/* Overall Progress */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold">Overall Progress</p>
              <span className="text-2xl font-bold tracking-tight text-primary">
                {selectedProject.stats.progress}<span className="text-sm font-medium text-muted-foreground">%</span>
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700 ease-out"
                style={{ width: `${selectedProject.stats.progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Total{' '}
              <span className="font-semibold text-foreground">{selectedProject.stats.completedTasks}</span>{' '}of{' '}
              <span className="font-semibold text-foreground">{selectedProject.stats.totalTasks}</span>{' '}tasks completed
            </p>
          </div>
        </div>

        {/* ═══════════════════ PROJECT STATISTICS ═══════════════════ */}
        <div className="mb-5">
          <h3 className="mb-3 font-semibold">Project Statistics</h3>
          <div className="flex flex-col gap-4">

            {/* Task Status Donut */}
            <TaskStatusCard stats={selectedProject.stats} />

            {/* Task Type Donut */}
            <TaskTypeCard detailTasks={detailTasks} isLoading={isDetailLoading} />

            {/* Team KPI Bar */}
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
                        <div className="flex w-32 items-center gap-3 shrink-0">
                          <div className="size-8 rounded-full bg-muted" />
                          <div className="h-3 w-16 rounded bg-muted" />
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
      </div>

      {/* Right Sidebar */}
      <aside className="hidden w-[340px] shrink-0 flex-col overflow-y-auto rounded-xl border border-border bg-card shadow-sm xl:flex">
        
        <section className="border-b border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><ClipboardList className="size-4" /> Summary</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">⠿</span>
              <span className="min-w-0 flex-1 truncate">Total Tasks: {selectedProject.stats.totalTasks}</span>
            </div>
             <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">⠿</span>
              <span className="min-w-0 flex-1 truncate">Completed: {selectedProject.stats.completedTasks}</span>
            </div>
             <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">⠿</span>
              <span className="min-w-0 flex-1 truncate">In Progress: {selectedProject.stats.inProgressTasks}</span>
            </div>
          </div>
          <button onClick={() => router.push('/tasks?projectId=' + selectedProject.id)} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            View tasks for this project <ChevronRight className="size-3.5" />
          </button>
        </section>

        <section className="border-b border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Users className="size-4" /> Contributors</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{selectedProject.members.length}</span>
          </div>
          <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {selectedProject.manager && (
              <div className="flex items-center gap-3">
                <div className="relative flex size-9 items-center justify-center rounded-full bg-muted font-medium text-foreground">
                  {selectedProject.manager.firstname.charAt(0)}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedProject.manager.firstname} {selectedProject.manager.lastname}</p>
                  <p className="text-xs text-primary font-medium">Project Manager</p>
                </div>
              </div>
            )}
            
            {selectedProject.members.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative flex size-9 items-center justify-center rounded-full bg-muted font-medium text-foreground">
                  {member.firstname.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.firstname} {member.lastname}</p>
                  <p className="text-xs text-muted-foreground">Member</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setIsContributorsOpen(true)} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Manage contributors <ChevronRight className="size-3.5" />
          </button>
        </section>

        <section className="border-b border-border p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Clock className="size-4" /> Time</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Start date</span><span>{new Date(selectedProject.start_date).toLocaleDateString()}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Target date</span><span>{new Date(selectedProject.end_date).toLocaleDateString()}</span></div>
          </div>
        </section>
      </aside>

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

      {/* Archive Confirmation Dialog */}
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

      {/* Team KPI Full List Dialog */}
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
                  {(projectDetailRes?.data?.memberKpi ?? selectedProject.members.map((m: any) => ({ userId: m.id, name: `${m.firstname} ${m.lastname || ''}`.trim(), assigned: 0, done: 0 }))).map((kpi: any, i: number) => {
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

export default ProjectPage
