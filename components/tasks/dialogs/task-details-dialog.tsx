import { Calendar, FolderDot, Trash2, Video, Clock, LayoutList } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { TASK_STATUS_MAP } from '@/types/tasks'
import { useTasks } from '../tasks-provider'
import { Task } from '@/types/tasks'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TaskDependencies } from '../task-dependencies'

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
    <Sheet open={taskDetailsOpen} onOpenChange={setTaskDetailsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col border-l border-border/60 shadow-2xl">
        {selectedTask && (
          <>
            <div className="p-6 pb-4 bg-background border-b border-border/40">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-3">
                  {selectedTask.tag && <Badge variant="secondary" className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${selectedTask.tagColor}`}>{selectedTask.tag}</Badge>}
                  <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-border/50">
                    {TASK_STATUS_MAP[selectedTask.status] || 'Unknown'}
                  </Badge>
                </div>
                <SheetTitle className="text-xl font-bold leading-tight">{selectedTask.title}</SheetTitle>
                
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground mt-4 pt-4 border-t border-border/40">
                  <span className="flex items-center gap-1.5"><FolderDot className="size-3.5 text-primary" /> {selectedTask.projectName}</span>
                  {selectedTask.dueDate && <span className="flex items-center gap-1.5"><Calendar className="size-3.5 text-primary" /> Due {selectedTask.dueDate.split('T')[0]}</span>}
                </div>
                
                <div className="mt-5 flex gap-2">
                   <Button size="sm" variant="secondary" className="shadow-sm font-medium w-full" onClick={() => setIsScheduleMeetingOpen(true)}>
                     <Video className="size-4 mr-2 text-primary" /> Schedule Meeting
                   </Button>
                </div>
              </SheetHeader>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-card/10 space-y-6">
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Description</h4>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-card p-4 rounded-xl border border-border/40 shadow-sm min-h-[100px]">
                  {selectedTask.description || <span className="text-muted-foreground italic">No description provided.</span>}
                </div>
              </div>
              
              {selectedTask.assignees.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Assignees</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedTask.assignees.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2.5 bg-card rounded-full pl-1.5 pr-4 py-1.5 border border-border/60 shadow-sm">
                         <Avatar className="size-6 border border-border/40">
                           <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{m.initials}</AvatarFallback>
                         </Avatar>
                         <span className="text-xs font-medium text-foreground">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-border/40">
                <TaskDependencies taskId={selectedTask.dbId} />
              </div>
            </div>
            
            <SheetFooter className="flex items-center justify-between border-t border-border/40 bg-background p-5">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive font-medium px-3"
                onClick={() => confirmDeleteTask(selectedTask.dbId)}
              >
                <Trash2 className="size-4 mr-2" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" size="sm" className="shadow-sm font-medium px-4" onClick={() => { setTaskDetailsOpen(false); onEditTask(selectedTask); }}>
                  <LayoutList className="size-3.5 mr-2" /> Edit
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
