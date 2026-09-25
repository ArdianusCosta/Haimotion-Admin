import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTasks } from '../tasks-provider'

export function ProjectDetailsDialog() {
  const { projectDialogOpen, setProjectDialogOpen, selectedProject } = useTasks()

  return (
    <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
      <DialogContent className="sm:max-w-2xl">
        {selectedProject && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedProject.name}</DialogTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Created on {selectedProject.startDate ? selectedProject.startDate.split('T')[0] : 'Unknown'}
                {selectedProject.endDate && ` • Due ${selectedProject.endDate.split('T')[0]}`}
              </div>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedProject.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Progress</h4>
                  <span className="text-sm font-bold text-primary">{selectedProject.progress}%</span>
                </div>
                <div className="h-3 w-full bg-muted overflow-hidden rounded-full flex">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${selectedProject.progress}%` }} 
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{selectedProject.completedTasks} completed</span>
                  <span>{selectedProject.totalTasks} total tasks</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3 text-center bg-card">
                  <div className="text-2xl font-bold text-foreground">{selectedProject.inProgressTasks}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">In Progress</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-center bg-card">
                  <div className="text-2xl font-bold text-foreground">{selectedProject.pendingTasks}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Pending</div>
                </div>
              </div>

              {selectedProject.members && selectedProject.members.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Project Members</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.members.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1 border border-border">
                         <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                           {m.initials}
                         </div>
                         <span className="text-xs font-medium">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
