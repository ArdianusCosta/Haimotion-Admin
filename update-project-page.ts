import fs from 'fs'

let code = fs.readFileSync('./components/project-page.tsx', 'utf-8')

// Imports
code = code.replace(
  `import { getProjects, deleteProject } from '@/app/actions/projects'`,
  `import { getProjects, deleteProject, toggleFavoriteProject, archiveProject, duplicateProject, exportProjectData } from '@/app/actions/projects'
import { useRouter } from 'next/navigation'
import { DependencyGraph } from '@/components/dependency-graph'
import { ProjectContributorsDialog } from '@/components/project-contributors-dialog'`
)

// State
code = code.replace(
  `const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)`,
  `const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isContributorsOpen, setIsContributorsOpen] = useState(false)
  const router = useRouter()`
)

// Mutations
code = code.replace(
  `const deleteMutation = useMutation({`,
  `const toggleFavorite = useMutation({
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
  
  const deleteMutation = useMutation({`
)

// Header Actions
code = code.replace(
  `<button onClick={() => toast('Project starred!')} className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">`,
  `<button onClick={() => toggleFavorite.mutate(selectedProject.id)} className={\`flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground \${selectedProject.is_favorite ? 'text-amber-500' : 'text-muted-foreground'}\`}>`
)

code = code.replace(
  `onClick={() => toast('Share link copied!')}`,
  `onClick={() => {
    navigator.clipboard.writeText(window.location.origin + '/projects/' + selectedProject.id)
    toast.success('Project link copied.')
  }}`
)

// Delivery Confidence
code = code.replace(
  `{selectedProject.stats.progress >= 75 ? 'On Track' : selectedProject.stats.progress >= 25 ? 'At Risk' : 'Critical'}`,
  `{selectedProject.stats.deliveryConfidence || (selectedProject.stats.progress >= 75 ? 'On Track' : selectedProject.stats.progress >= 25 ? 'At Risk' : 'Blocked')}`
)

// More Menu
code = code.replace(
  `<button 
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-destructive hover:text-destructive text-muted-foreground"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
            </button>`,
  `<button 
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
            </DropdownMenu>`
)

// View full task board button
code = code.replace(
  `<button onClick={() => toast('Coming soon')} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            View full task board <ChevronRight className="size-3.5" />
          </button>`,
  `<button onClick={() => router.push('/tasks?projectId=' + selectedProject.id)} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            View full task board <ChevronRight className="size-3.5" />
          </button>`
)

// Manage contributors button
code = code.replace(
  `<button onClick={() => toast('Coming soon')} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Manage contributors <ChevronRight className="size-3.5" />
          </button>`,
  `<button onClick={() => setIsContributorsOpen(true)} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            Manage contributors <ChevronRight className="size-3.5" />
          </button>`
)

// Tabs rendering
code = code.replace(
  `<div className="flex h-[320px] items-center justify-center sm:h-[360px]">
            <span className="text-xs text-muted-foreground">Loading {activeTab.toLowerCase()} content for {selectedProject.name}...</span>
          </div>`,
  `{activeTab === 'Dependencies' ? (
            <div className="flex h-auto min-h-[320px] items-start justify-center sm:min-h-[360px] p-4">
              <DependencyGraph tasks={selectedProject.tasks || []} />
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center sm:h-[360px]">
              <span className="text-xs text-muted-foreground">Loading {activeTab.toLowerCase()} content for {selectedProject.name}...</span>
            </div>
          )}`
)

// Render Contributors Dialog
code = code.replace(
  `<ProjectFormDialog 
        open={isFormOpen} `,
  `<ProjectContributorsDialog 
        open={isContributorsOpen} 
        onOpenChange={setIsContributorsOpen} 
        project={selectedProject} 
        allUsers={users} 
      />
      <ProjectFormDialog 
        open={isFormOpen} `
)

fs.writeFileSync('./components/project-page.tsx', code)
