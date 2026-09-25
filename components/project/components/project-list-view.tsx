import React from 'react'
import { Plus, Search, Filter, ClipboardList, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectFormDialog } from '@/components/project-form-dialog'
import { stripHtmlTags } from '../utils/html-helpers'

export const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'On Hold', color: 'bg-amber-500/10 text-amber-600' },
  1: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  2: { label: 'Active', color: 'bg-blue-500/10 text-blue-600' },
  5: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600' },
  6: { label: 'In Review', color: 'bg-purple-500/10 text-purple-600' },
}

export function ProjectListView({
  statusFilter, setStatusFilter,
  searchQuery, setSearchQuery,
  setIsFormOpen, isFormOpen,
  isLoading, filteredProjects,
  setSelectedProjectId, users
}: any) {
  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your active projects and deliverables.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="size-4" /> 
                {statusFilter === null ? 'Filter' : statusFilter === 2 ? 'Active' : statusFilter === 5 ? 'Done' : statusFilter === 0 ? 'On Hold' : 'Pending'}
              </Button>
            </DropdownMenuTrigger>
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
            <span className="text-muted-foreground animate-pulse">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
            <ClipboardList className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or create a new project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project: any) => (
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
                    <span className="font-medium text-foreground">{project.stats?.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${project.stats?.progress || 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {project.stats?.completedTasks || 0} / {project.stats?.totalTasks || 0} Tasks Completed
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      Due: {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {project.manager && (
                       <div 
                        className="relative flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] font-medium text-foreground"
                        title={`PM: ${project.manager.firstname}`}
                       >
                          {project.manager.firstname?.charAt(0)}
                          <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-primary" />
                       </div>
                    )}
                    {project.members?.slice(0, 3).map((member: any) => (
                      <div 
                        key={member.id}
                        className="flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] font-medium text-foreground"
                        title={member.firstname}
                      >
                        {member.firstname?.charAt(0)}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
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
