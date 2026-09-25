import { Calendar, FolderDot, Trash2, Video, Clock, LayoutList } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TASK_STATUS_MAP } from '@/types/tasks'
import { useTasks } from '../tasks-provider'
import { Task } from '@/types/tasks'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function TaskDetailsDialog({ onEditTask }: { onEditTask: (task: Task) => void }) {
  const { 
    taskDetailsOpen, setTaskDetailsOpen, 
    selectedTask, setTaskToDelete, setDeleteDialogOpen,
    setIsScheduleMeetingOpen 
  } = useTasks()

  const confirmDeleteTask = (id: number) => {
    setTaskToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <Dialog open={taskDetailsOpen} onOpenChange={setTaskDetailsOpen}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/60 shadow-2xl">
        {selectedTask && (
          <>
            <div className="p-6 pb-4 bg-background/50 backdrop-blur-sm">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-3">
                  {selectedTask.tag && <Badge variant="secondary" className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${selectedTask.tagColor}`}>{selectedTask.tag}</Badge>}
                  <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-border/50">
                    {TASK_STATUS_MAP[selectedTask.status] || 'Unknown'}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl font-bold leading-tight">{selectedTask.title}</DialogTitle>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground mt-4 border-t border-border/40 pt-4">
                  <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40"><FolderDot className="size-3.5 text-primary" /> {selectedTask.projectName}</span>
                  {selectedTask.dueDate && <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40"><Calendar className="size-3.5 text-primary" /> Due {selectedTask.dueDate.split('T')[0]}</span>}
                </div>
                
                <div className="mt-5 flex gap-2">
                   <Button size="sm" variant="secondary" className="shadow-sm font-medium" onClick={() => setIsScheduleMeetingOpen(true)}>
                     <Video className="size-4 mr-2 text-primary" /> Schedule Meeting
                   </Button>
                </div>
              </DialogHeader>
            </div>
            
            <div className="px-6 py-2 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar bg-card/20">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Description</h4>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-card p-4 rounded-xl border border-border/40 shadow-sm min-h-[100px]">
                  {selectedTask.description || <span className="text-muted-foreground italic">No description provided.</span>}
                </div>
              </div>
              
              {selectedTask.assignees.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Assignees</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedTask.assignees.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2.5 bg-card rounded-full pl-1.5 pr-4 py-1.5 border border-border/60 shadow-sm transition-transform hover:scale-105 cursor-default">
                         <Avatar className="size-7 border border-border/40">
                           <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{m.initials}</AvatarFallback>
                         </Avatar>
                         <span className="text-xs font-medium text-foreground">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex items-center justify-between border-t border-border/40 bg-background/95 backdrop-blur-sm p-5 sm:justify-between">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
                onClick={() => confirmDeleteTask(selectedTask.dbId)}
              >
                <Trash2 className="size-4 mr-2" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="shadow-sm font-medium" onClick={() => setTaskDetailsOpen(false)}>Close</Button>
                <Button type="button" className="shadow-sm font-medium px-6" onClick={() => { setTaskDetailsOpen(false); onEditTask(selectedTask); }}>
                  <LayoutList className="size-4 mr-2" /> Edit Task
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
