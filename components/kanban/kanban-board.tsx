import { CalendarDays, MessageSquare, Paperclip } from 'lucide-react'
import { useKanban } from './kanban-provider'
import { KanbanTask } from '@/types/kanban'

export function KanbanBoard() {
  const { 
    loading, filteredColumns, 
    setSelectedTask, setIsDetailsDialogOpen,
    moveTaskMutation 
  } = useKanban()

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColId: string, taskDbId: number) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.setData('sourceColId', sourceColId)
    e.dataTransfer.setData('taskDbId', taskDbId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const sourceColId = e.dataTransfer.getData('sourceColId')
    const taskDbId = parseInt(e.dataTransfer.getData('taskDbId'))
    
    if (!taskId || !taskDbId || sourceColId === targetStatusId) return

    const newStatus = parseInt(targetStatusId)
    moveTaskMutation.mutate({ dbId: taskDbId, newStatus, movedTaskId: taskId })
  }

  const openTaskDetails = (task: KanbanTask) => {
    setSelectedTask(task)
    setIsDetailsDialogOpen(true)
  }

  return (
    <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
      {loading ? (
        // Skeleton Loading
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex w-[320px] shrink-0 flex-col rounded-xl bg-muted/30 p-3 border border-border/50 animate-pulse">
            <div className="mb-4 flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-xl border border-border bg-card p-4 h-32" />
              ))}
            </div>
          </div>
        ))
      ) : (
        filteredColumns.map((column: any) => (
          <div 
            key={column.id} 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className="flex w-[320px] shrink-0 flex-col rounded-xl bg-muted/30 p-3 transition-colors border border-border/50"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${column.color}`} />
                <h2 className="font-semibold">{column.title}</h2>
                <span className="flex size-5 items-center justify-center rounded-full bg-background border border-border text-[10px] font-medium text-muted-foreground">
                  {column.tasks.length}
                </span>
              </div>
            </div>
            
            {/* Task List */}
            <div className="flex flex-col gap-3 flex-1 min-h-[200px]">
              {column.tasks.map((task: KanbanTask) => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id, column.id, task.dbId)}
                  onClick={() => openTaskDetails(task)}
                  className="group cursor-grab active:cursor-grabbing relative rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-medium ${task.tagColor}`}>{task.tag}</span>
                  </div>
                  
                  <h3 className="font-medium text-foreground">{task.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="flex gap-3 text-muted-foreground">
                      {task.comments > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <MessageSquare className="size-3.5" /> <span>{task.comments}</span>
                        </div>
                      )}
                      {task.attachments > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Paperclip className="size-3.5" /> <span>{task.attachments}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <CalendarDays className="size-3" /> {task.date}
                      </div>
                      {task.assignees.length > 0 && (
                        <div className="flex -space-x-2">
                          {task.assignees.map((a: any, i: number) => (
                            <div key={i} title={a.name} className={`flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[9px] font-bold text-primary-foreground`}>
                              {a.initials}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
