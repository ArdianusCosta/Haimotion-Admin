import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTaskDependencies, addTaskDependency, removeTaskDependency } from '@/app/actions/tasks'
import { getTasksData } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Link2, Unlink2, CheckCircle2, Clock } from 'lucide-react'

export function TaskDependencies({ taskId }: { taskId: number }) {
  const queryClient = useQueryClient()
  const [selectedTask, setSelectedTask] = useState<string>('')
  
  const { data: dependencies, isLoading } = useQuery({
    queryKey: ['taskDependencies', taskId],
    queryFn: async () => {
      const res = await getTaskDependencies(taskId)
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  // We need to fetch all tasks to show in the dropdown to select dependencies
  // In a real app, this should probably be a searchable dropdown or scoped to the project
  const { data: allTasks } = useQuery({
    queryKey: ['allTasksForDeps'],
    queryFn: async () => {
      const res = await getTasksData()
      if (!res.success) throw new Error(res.error)
      // filter out the current task to prevent circular deps initially
      return (res.data || []).filter((t: any) => t.id !== taskId)
    }
  })

  const addMutation = useMutation({
    mutationFn: () => addTaskDependency(taskId, parseInt(selectedTask)),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Dependency added')
        setSelectedTask('')
        queryClient.invalidateQueries({ queryKey: ['taskDependencies', taskId] })
      } else toast.error(res.error)
    }
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeTaskDependency(id, taskId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Dependency removed')
        queryClient.invalidateQueries({ queryKey: ['taskDependencies', taskId] })
      } else toast.error(res.error)
    }
  })

  const handleAdd = () => {
    if (!selectedTask) return
    addMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Link2 className="size-4" /> Dependencies
      </h4>
      
      {isLoading ? (
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      ) : dependencies?.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No dependencies blocking this task.</p>
      ) : (
        <div className="space-y-2">
          {dependencies?.map((dep: any) => (
            <div key={dep.id} className="flex items-center justify-between p-2 rounded-md border text-sm">
              <div className="flex items-center gap-2">
                {dep.depends_on_task.status === 5 ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <Clock className="size-4 text-amber-500" />
                )}
                <span className={dep.depends_on_task.status === 5 ? 'line-through text-muted-foreground' : ''}>
                  {dep.depends_on_task.task}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeMutation.mutate(dep.id)}
              >
                <Unlink2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <Select value={selectedTask} onValueChange={setSelectedTask}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Add dependency..." />
          </SelectTrigger>
          <SelectContent>
            {allTasks?.map((t: any) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.task}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" onClick={handleAdd} disabled={!selectedTask || addMutation.isPending}>
          Add
        </Button>
      </div>
    </div>
  )
}
