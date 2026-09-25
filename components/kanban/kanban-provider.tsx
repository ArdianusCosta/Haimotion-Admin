'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getKanbanTasks, updateTaskStatus, getTaskDetails, addComment, uploadAttachment } from '@/app/actions/kanban'
import { toast } from 'sonner'
import { KanbanColumn, KanbanUser, KanbanTask } from '@/types/kanban'

interface KanbanContextType {
  columns: KanbanColumn[]
  filteredColumns: KanbanColumn[]
  users: KanbanUser[]
  loading: boolean
  
  // Dialog and Modals
  isDetailsDialogOpen: boolean
  setIsDetailsDialogOpen: (v: boolean) => void
  
  // Selected Data
  selectedTask: KanbanTask | null
  setSelectedTask: (t: KanbanTask | null) => void
  taskDetails: any
  detailsLoading: boolean
  
  // Filters
  searchQuery: string
  setSearchQuery: (q: string) => void
  filterAssignees: number[]
  setFilterAssignees: (ids: number[]) => void
  showFilterDropdown: boolean
  setShowFilterDropdown: (v: boolean) => void
  
  // Mutations
  moveTaskMutation: any
  addCommentMutation: any
  uploadAttachmentMutation: any
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined)

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data, isLoading: loading } = useQuery({
    queryKey: ['kanbanTasks'],
    queryFn: async () => {
      const res = await getKanbanTasks()
      if (!res.success) throw new Error(res.error)
      return res
    }
  })

  const columns = (data?.data || []) as KanbanColumn[]
  const users = (data?.users || []) as KanbanUser[]

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)
  
  const { data: taskDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['taskDetails', selectedTask?.dbId],
    queryFn: async () => {
      if (!selectedTask) return null
      const res = await getTaskDetails(selectedTask.dbId)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    enabled: !!selectedTask && isDetailsDialogOpen
  })
  
  const taskDetails = taskDetailsData || { comments: [], attachments: [] }

  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssignees, setFilterAssignees] = useState<number[]>([])
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const moveTaskMutation = useMutation({
    mutationFn: async ({ dbId, newStatus, movedTaskId }: { dbId: number, newStatus: number, movedTaskId: string }) => {
      const res = await updateTaskStatus(dbId, newStatus)
      if (!res.success) throw new Error(res?.error || 'Failed to update')
      return res
    },
    onMutate: async ({ newStatus, movedTaskId }) => {
      await queryClient.cancelQueries({ queryKey: ['kanbanTasks'] })
      const previousData = queryClient.getQueryData(['kanbanTasks'])
      
      queryClient.setQueryData(['kanbanTasks'], (old: any) => {
        if (!old) return old
        
        const newCols = old.data.map((c: any) => ({ ...c, tasks: [...c.tasks] }))
        let taskToMove: any = null
        
        for (const col of newCols) {
          const idx = col.tasks.findIndex((t: any) => t.id === movedTaskId)
          if (idx > -1) {
            taskToMove = { ...col.tasks[idx], status: newStatus }
            col.tasks.splice(idx, 1)
            break
          }
        }
        
        if (taskToMove) {
          const targetCol = newCols.find((c: any) => parseInt(c.id) === newStatus)
          if (targetCol) {
            targetCol.tasks.push(taskToMove)
          }
        }
        
        return { ...old, data: newCols }
      })
      
      return { previousData }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['kanbanTasks'], context?.previousData)
      toast.error('Failed to move task')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanTasks'] })
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: async (payload: { taskId: number, userId: number, text: string }) => {
      return await addComment(payload.taskId, payload.userId, payload.text)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDetails', selectedTask?.dbId] })
      queryClient.invalidateQueries({ queryKey: ['kanbanTasks'] })
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add comment')
  })

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (payload: { taskId: number, url: string, name: string }) => {
      return await uploadAttachment(payload.taskId, payload.url, payload.name)
    },
    onSuccess: () => {
      toast.success('File uploaded')
      queryClient.invalidateQueries({ queryKey: ['taskDetails', selectedTask?.dbId] })
      queryClient.invalidateQueries({ queryKey: ['kanbanTasks'] })
    },
    onError: (err: any) => toast.error(err.message || 'Upload failed')
  })

  const filteredColumns = columns.map((col: KanbanColumn) => ({
    ...col,
    tasks: col.tasks.filter((task: KanbanTask) => {
      const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchFilter = filterAssignees.length === 0 || 
                          filterAssignees.some(id => task.assignees.some((a: any) => a.id === id))
      return matchSearch && matchFilter
    })
  }))

  return (
    <KanbanContext.Provider value={{
      columns, filteredColumns, users, loading,
      isDetailsDialogOpen, setIsDetailsDialogOpen,
      selectedTask, setSelectedTask,
      taskDetails, detailsLoading,
      searchQuery, setSearchQuery,
      filterAssignees, setFilterAssignees,
      showFilterDropdown, setShowFilterDropdown,
      moveTaskMutation, addCommentMutation, uploadAttachmentMutation
    }}>
      {children}
    </KanbanContext.Provider>
  )
}

export const useKanban = () => {
  const context = useContext(KanbanContext)
  if (!context) throw new Error('useKanban must be used within KanbanProvider')
  return context
}
