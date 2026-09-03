
'use client'

import { useState } from 'react'
import { 
  ChevronRight, Star, Share2, MoreHorizontal, Users, Settings, 
  FileText, Link2, GitBranch, Clock, Info, CalendarDays, 
  CheckCircle, File, Lightbulb, ClipboardList, Plus, Search, Filter, 
  Trash2, Edit, ChevronLeft, Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, deleteProject, toggleFavoriteProject, archiveProject, duplicateProject, exportProjectData } from '@/app/actions/projects'
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

export function ProjectPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('Dependencies')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isContributorsOpen, setIsContributorsOpen] = useState(false)
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
      if(res.success) {
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
        const blob = new Blob([res.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename
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

  const tabs = ['Overview', 'Tasks', 'Issues', 'Dependencies', 'Timeline', 'Activity', 'Comments']

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
                  {statusFilter === null ? 'Filter' : statusFilter === 2 ? 'Active' : statusFilter === 5 ? 'Done' : 'Pending'}
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem checked={statusFilter === null} onCheckedChange={() => setStatusFilter(null)}>All Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 2} onCheckedChange={() => setStatusFilter(2)}>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 0} onCheckedChange={() => setStatusFilter(0)}>Pending</DropdownMenuCheckboxItem>
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
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Status: {project.status}
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
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-2 pb-8">
        
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
                <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => duplicateMutation.mutate(selectedProject.id)}>Duplicate project</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => archiveMutation.mutate(selectedProject.id)}>Archive project</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => exportMutation.mutate(selectedProject.id)}>Export project</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{selectedProject.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Status: {selectedProject.status}</div>
            <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold">
              <Users className="size-3.5" /> {selectedProject.members.length} contributors
            </div>
            {selectedProject.manager && (
              <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold">
                <Settings className="size-3.5" /> PM: {selectedProject.manager.firstname}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" /> ID: {selectedProject.id}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" /> <span className="text-foreground">Created: {new Date(selectedProject.date_created).toLocaleDateString()}</span>
            </span>
          </div>
          
          <div 
             className="text-sm text-muted-foreground mt-2 max-w-3xl"
             dangerouslySetInnerHTML={{ __html: deeplyDecodeHTML(selectedProject.description) }} 
          />
        </div>

        <div className="mb-1 rounded-[14px] border border-border bg-muted/40 p-1">
          <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
            <div className="flex min-h-24 flex-col justify-between rounded-[10px] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">Project progress <Info className="size-3.5" /></div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-semibold tracking-tight">{selectedProject.stats.progress}<span className="text-sm text-muted-foreground">%</span></p>
                <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"><GitBranch className="size-3" /></div>
              </div>
            </div>
            <div className="flex min-h-24 flex-col justify-between rounded-[10px] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" /> Due date</div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-semibold tracking-tight">{new Date(selectedProject.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                <Clock className="size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex min-h-24 flex-col justify-between rounded-[10px] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="size-4" /> Tasks completed</div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-semibold tracking-tight">{selectedProject.stats.completedTasks}<span className="text-sm text-muted-foreground"> / {selectedProject.stats.totalTasks}</span></p>
                <CheckCircle className="size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex min-h-24 flex-col justify-between rounded-[10px] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><File className="size-4" /> Members</div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-semibold tracking-tight">{selectedProject.members.length}</p>
                <Users className="size-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery confidence */}
        <div className="mb-6 mt-4 flex flex-wrap gap-x-4 gap-y-2 rounded-[10px] border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
          <span>Delivery confidence: <span className="font-medium text-foreground">
            {selectedProject.stats.deliveryConfidence || (selectedProject.stats.progress >= 75 ? 'On Track' : selectedProject.stats.progress >= 25 ? 'At Risk' : 'Blocked')}
          </span></span>
          <span className="hidden sm:inline text-border">•</span>
          <span>{selectedProject.stats.progress}% completed</span>
        </div>

        {/* Progress Stages */}
        <div className="mb-6 overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
          <div className="grid grid-cols-2 border-b border-border md:grid-cols-4">
            {[
              ['Pending', selectedProject.stats.pendingTasks], 
              ['In Progress', selectedProject.stats.inProgressTasks], 
              ['Done', selectedProject.stats.completedTasks], 
              ['Total', selectedProject.stats.totalTasks]
            ].map(([label, val], i) => (
              <div key={label} className={`border-b border-border p-4 md:border-b-0 ${i !== 3 ? 'md:border-r' : ''} ${i % 2 === 0 && i !== 3 ? 'border-r' : ''}`}>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">{val}</p>
              </div>
            ))}
          </div>
          <div className="relative h-20 bg-muted/10">
            {/* Visual gradient placeholder to represent the SVG flow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/60" />
            <div className="absolute inset-0 flex items-center justify-between px-[10%]">
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium shadow-sm">{selectedProject.stats.progress}% →</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-6 overflow-x-auto border-b border-border px-1 text-sm sm:gap-8 sm:px-3">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 py-3 transition-colors ${activeTab === tab ? 'border-foreground font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-[14px] border border-border bg-card shadow-sm">
          {activeTab === 'Dependencies' ? (
            <div className="flex h-auto min-h-[320px] items-start justify-center sm:min-h-[360px] p-4">
              <DependencyGraph tasks={selectedProject.tasks || []} />
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center sm:h-[360px]">
              <span className="text-xs text-muted-foreground">Loading {activeTab.toLowerCase()} content for {selectedProject.name}...</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-sm">
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-chart-1" /> On Track</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-chart-2" /> At Risk</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-destructive" /> Blocked</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-muted-foreground/50" /> External</span>
            <span className="flex items-center gap-2"><span className="h-px w-8 border-t border-dashed border-muted-foreground" /> Dependency</span>
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
            View full task board <ChevronRight className="size-3.5" />
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
    </div>
  )
}

export default ProjectPage
