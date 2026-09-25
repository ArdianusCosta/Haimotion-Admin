'use client'

import React, { createContext, useContext, useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasksData, createTask, updateTask, deleteTask } from '@/app/actions/tasks'
import { toast } from 'sonner'
import { Task, Project, User } from '@/types/tasks'

export type TaskTab = 'all' | 'my-tasks' | 'assigned' | 'due-soon'

interface TasksContextType {
  // Data
  tasks: Task[]
  projects: Project[]
  users: User[]
  currentUserId: number
  loading: boolean

  selectedTab: TaskTab
  setSelectedTab: (t: TaskTab) => void
  selectedProjectId: number | null
  setSelectedProjectId: (id: number | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  
  // Derived State
  filteredTasks: Task[]
  todayCount: number
  upcomingCount: number
  overdueCount: number
  completedCount: number
  
  // Dialogs
  taskDialogOpen: boolean
  setTaskDialogOpen: (v: boolean) => void
  projectDialogOpen: boolean
  setProjectDialogOpen: (v: boolean) => void
  taskDetailsOpen: boolean
  setTaskDetailsOpen: (v: boolean) => void
  deleteDialogOpen: boolean
  setDeleteDialogOpen: (v: boolean) => void
  isScheduleMeetingOpen: boolean
  setIsScheduleMeetingOpen: (v: boolean) => void
  
  // Selected Items
  selectedTask: Task | null
  setSelectedTask: (t: Task | null) => void
  selectedProject: Project | null
  setSelectedProject: (p: Project | null) => void
  taskToDelete: number | null
  setTaskToDelete: (id: number | null) => void

  // Actions
  handleToggleTaskStatus: (task: Task) => void
  handleStatusChange: (task: Task, newStatus: number) => void
  executeDelete: () => void
  toggleStatusMutation: any
  changeStatusMutation: any
  deleteTaskMutation: any
  saveTaskMutation: any
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  
  const { data, isLoading: loading } = useQuery({
    queryKey: ['tasksData'],
    queryFn: async () => {
      const res = await getTasksData()
      if (!res.success) throw new Error(res.error)
      return res
    }
  })

  const tasks = (data?.tasks || []) as Task[]
  const projects = (data?.projects || []) as Project[]
  const users = (data?.users || []) as User[]
  const currentUserId = data?.currentUserId || 0

  const [selectedTab, setSelectedTab] = useState<TaskTab>('all')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]
  
  const todayCount = tasks.filter((t: any) => t.status !== 5 && t.dueDate && t.dueDate.startsWith(todayStr)).length
  const upcomingCount = tasks.filter((t: any) => t.status !== 5 && t.dueDate && t.dueDate > todayStr).length
  const overdueCount = tasks.filter((t: any) => t.status !== 5 && t.dueDate && t.dueDate < todayStr).length
  const completedCount = tasks.filter((t: any) => t.status === 5).length

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (selectedTab === 'my-tasks') {
      result = result.filter((t: any) => t.assignees.some((a: any) => Number(a.id) === currentUserId))
    } else if (selectedTab === 'assigned') {
      result = result.filter((t: any) => t.assignees.length > 0)
    } else if (selectedTab === 'due-soon') {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]
      result = result.filter((t: any) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= nextWeekStr && t.status !== 5)
    }

    if (selectedProjectId) {
      result = result.filter((t: any) => t.projectId === selectedProjectId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t: any) => 
        t.title.toLowerCase().includes(q) || 
        (t.rawDescription && t.rawDescription.toLowerCase().includes(q)) ||
        (t.projectName && t.projectName.toLowerCase().includes(q))
      )
    }

    return result
  }, [tasks, selectedTab, selectedProjectId, searchQuery, currentUserId, todayStr])

  const toggleStatusMutation = useMutation({
    mutationFn: async (task: any) => {
      const newStatus = task.status === 5 ? 1 : 5
      return updateTask(task.dbId, {
        title: task.title,
        description: task.rawDescription,
        status: newStatus,
        assignees: task.assignees.map((a:any)=>a.id),
        projectId: task.projectId,
        dueDate: task.dueDate
      })
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['tasksData'] })
      const previousData = queryClient.getQueryData(['tasksData'])
      const newStatus = task.status === 5 ? 1 : 5
      queryClient.setQueryData(['tasksData'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t)
        }
      })
      return { previousData }
    },
    onSuccess: () => toast.success('Task status updated'),
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['tasksData'], context?.previousData)
      toast.error('Failed to update status')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasksData'] })
  })

  const changeStatusMutation = useMutation({
    mutationFn: async ({ task, newStatus }: { task: any, newStatus: number }) => {
      return updateTask(task.dbId, {
        title: task.title,
        description: task.rawDescription,
        status: newStatus,
        assignees: task.assignees.map((a:any)=>a.id),
        projectId: task.projectId,
        dueDate: task.dueDate
      })
    },
    onMutate: async ({ task, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasksData'] })
      const previousData = queryClient.getQueryData(['tasksData'])
      queryClient.setQueryData(['tasksData'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t)
        }
      })
      return { previousData }
    },
    onSuccess: () => toast.success('Task status updated'),
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['tasksData'], context?.previousData)
      toast.error('Failed to update status')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasksData'] })
  })

  const saveTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      return payload.id 
        ? await updateTask(payload.id, payload)
        : await createTask(payload)
    },
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(res.isUpdate ? 'Task updated' : 'Task created')
        setTaskDialogOpen(false)
        queryClient.refetchQueries({ queryKey: ['tasksData'] })
      } else {
        toast.error(res.error || 'Failed to save task')
      }
    },
    onError: () => toast.error('An error occurred while saving')
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => await deleteTask(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Task deleted')
        setTaskDetailsOpen(false)
        queryClient.invalidateQueries({ queryKey: ['tasksData'] })
      } else {
        toast.error(res.error || 'Failed to delete task')
      }
    },
    onError: () => toast.error('An error occurred while deleting')
  })

  const handleToggleTaskStatus = (task: Task) => toggleStatusMutation.mutate(task)
  const handleStatusChange = (task: Task, newStatus: number) => changeStatusMutation.mutate({ task, newStatus })
  const executeDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete)
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }

  return (
    <TasksContext.Provider value={{
      tasks, projects, users, currentUserId, loading,
      selectedTab, setSelectedTab,
      selectedProjectId, setSelectedProjectId,
      searchQuery, setSearchQuery,
      filteredTasks, todayCount, upcomingCount, overdueCount, completedCount,
      taskDialogOpen, setTaskDialogOpen,
      projectDialogOpen, setProjectDialogOpen,
      taskDetailsOpen, setTaskDetailsOpen,
      deleteDialogOpen, setDeleteDialogOpen,
      isScheduleMeetingOpen, setIsScheduleMeetingOpen,
      selectedTask, setSelectedTask,
      selectedProject, setSelectedProject,
      taskToDelete, setTaskToDelete,
      handleToggleTaskStatus, handleStatusChange, executeDelete,
      toggleStatusMutation, changeStatusMutation, deleteTaskMutation,
      saveTaskMutation
    }}>
      {children}
    </TasksContext.Provider>
  )
}

export const useTasks = () => {
  const context = useContext(TasksContext)
  if (!context) throw new Error('useTasks must be used within TasksProvider')
  return context
}
