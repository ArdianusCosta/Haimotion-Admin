import { FolderDot, Plus, Search, Layers, LayoutGrid } from 'lucide-react'
import { useTasks } from './tasks-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function TasksSidebar({ onNewTask }: { onNewTask: () => void }) {
  const { 
    projects, 
    selectedProjectId, setSelectedProjectId,
  } = useTasks()

  const [searchProject, setSearchProject] = useState('')

  const filteredProjects = projects.filter((p: any) => 
    p.name.toLowerCase().includes(searchProject.toLowerCase())
  )

  return (
    <div className="w-60 shrink-0 hidden md:flex flex-col h-full border-r border-border/40 bg-card/10">
      <div className="p-4 border-b border-border/40">
        <Button onClick={onNewTask} className="w-full justify-start shadow-sm font-medium h-10 bg-primary/90 hover:bg-primary">
          <Plus className="mr-2 size-4" /> New Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LayoutGrid className="size-3" /> Projects
              </h4>
            </div>
            
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input 
                value={searchProject}
                onChange={(e) => setSearchProject(e.target.value)}
                placeholder="Search projects..."
                className="pl-7 h-7 text-xs bg-transparent border-transparent shadow-none hover:bg-muted/30 focus-visible:ring-1 focus-visible:bg-background transition-all"
              />
            </div>

            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedProjectId(null)}
                className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${
                  selectedProjectId === null 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className={`size-3.5 shrink-0 ${selectedProjectId === null ? 'text-primary' : 'text-muted-foreground/70'}`} />
                  <span className="truncate">All Projects</span>
                </div>
              </button>

              {filteredProjects.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${
                    selectedProjectId === p.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderDot className={`size-3.5 shrink-0 ${selectedProjectId === p.id ? 'text-primary' : 'text-muted-foreground/70'}`} />
                    <span className="truncate">{p.name}</span>
                  </div>
                </button>
              ))}
              {filteredProjects.length === 0 && searchProject && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground italic">No projects found.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
