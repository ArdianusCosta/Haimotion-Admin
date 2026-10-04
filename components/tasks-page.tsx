'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Search, Bell, User as UserIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScheduleMeetingDialog } from '@/components/meetings/dialogs/schedule-meeting-dialog'

import { TasksProvider, useTasks } from './tasks/tasks-provider'
import { TasksSidebar } from './tasks/tasks-sidebar'
import { TasksList } from './tasks/tasks-list'
import { TaskFormDialog } from './tasks/dialogs/task-form-dialog'
import { ProjectDetailsDialog } from './tasks/dialogs/project-details-dialog'
import { TaskDetailsDialog } from './tasks/dialogs/task-details-dialog'
import { getTaskForEdit } from '@/app/actions/tasks'
import { Task } from '@/types/tasks'

function TasksContent() {
  const { 
    projects, setTaskDialogOpen, 
    deleteDialogOpen, setDeleteDialogOpen, executeDelete, deleteTaskMutation,
    isScheduleMeetingOpen, setIsScheduleMeetingOpen, selectedTask,
    saveTaskMutation, todayCount, upcomingCount, overdueCount, completedCount
  } = useTasks()

  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    description: '',
    status: 1,
    projectId: 0,
    assignees: [] as number[],
    dueDate: ''
  })

  const openNewTaskDialog = () => {
    setFormData({
      id: 0,
      title: '',
      description: '',
      status: 1,
      projectId: projects[0]?.id || 0,
      assignees: [],
      dueDate: ''
    })
    setTaskDialogOpen(true)
  }

  const openEditTaskDialog = async (task: Task) => {
    const res = await getTaskForEdit(task.dbId)
    if (res.success && res.task) {
      setFormData({
        id: res.task.id,
        title: res.task.title,
        description: res.task.description,
        status: res.task.status,
        projectId: res.task.projectId,
        assignees: res.task.assignees,
        dueDate: res.task.dueDate
      })
    } else {
      const assigneeIds = (task.assignees || []).map((a: any) => Number(a.id))
      setFormData({
        id: task.dbId,
        title: task.title,
        description: task.rawDescription || task.description || '',
        status: task.status,
        projectId: task.projectId,
        assignees: assigneeIds,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      })
    }
    setTaskDialogOpen(true)
  }

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.projectId) {
      toast.error("Please select a project")
      return
    }
    
    saveTaskMutation.mutate({
      title: formData.title,
      description: formData.description,
      status: formData.status,
      assignees: formData.assignees,
      projectId: formData.projectId,
      dueDate: formData.dueDate
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden border-t border-border/40">
      <TasksSidebar onNewTask={openNewTaskDialog} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-border/40 bg-background/95 px-6 py-5 sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Tasks</h1>
            <p className="hidden sm:block text-sm text-muted-foreground mt-0.5">Manage and organize your team's work</p>
          </div>
          <Button onClick={openNewTaskDialog} className="shadow-sm bg-primary/90 hover:bg-primary h-9 px-4 md:hidden">
            <Plus className="mr-2 size-4" /> New Task
          </Button>
        </div>

        <div className="flex-1 p-6 md:p-8 w-full space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm hover:shadow-md hover:bg-card/60 transition-all">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="text-2xl font-semibold text-foreground">{todayCount + upcomingCount + overdueCount}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm hover:shadow-md hover:bg-card/60 transition-all">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="text-2xl font-semibold text-foreground">{todayCount}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-destructive/20 bg-destructive/5 p-4 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/80">Overdue</p>
            <p className="text-2xl font-semibold text-destructive">{overdueCount}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm hover:shadow-md hover:bg-card/60 transition-all opacity-80">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold text-muted-foreground">{completedCount}</p>
          </div>
        </div>

        {/* Task List Component handles tabs, filters, and grouping */}
        <TasksList onEditTask={openEditTaskDialog} />
      </div>

      <TaskFormDialog 
        formData={formData} 
        setFormData={setFormData} 
        handleSaveTask={handleSaveTask}
        saveTaskMutation={saveTaskMutation} 
      />
      
      <ProjectDetailsDialog />
      <TaskDetailsDialog onEditTask={openEditTaskDialog} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this task? This action cannot be undone.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deleteTaskMutation.isPending}>
              {deleteTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <ScheduleMeetingDialog 
          open={isScheduleMeetingOpen} 
          onOpenChange={setIsScheduleMeetingOpen} 
          defaultValues={{ taskId: selectedTask?.dbId, projectId: selectedTask?.projectId }}
        />
      </div>
    </div>
  )
}

export function TasksPage() {
  return (
    <TasksProvider>
      <TasksContent />
    </TasksProvider>
  )
}

export default TasksPage
