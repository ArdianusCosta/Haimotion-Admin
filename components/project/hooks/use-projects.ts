import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getProjects, getProjectById, deleteProject, toggleFavoriteProject, 
  archiveProject, duplicateProject, exportProjectData 
} from '@/app/actions/projects'

export function useProjects() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('Dependencies')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isContributorsOpen, setIsContributorsOpen] = useState(false)
  const [isKpiDialogOpen, setIsKpiDialogOpen] = useState(false)
  
  const queryClient = useQueryClient()
  
  const { data: projectsRes, isLoading, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  })
  
  const toggleFavorite = useMutation({
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
      if(res.success && res.data) {
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
        const blob = new Blob([res.data ?? ''], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename ?? 'export.json'
        a.click()
      } else toast.error('Failed to export')
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Project deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        setSelectedProjectId(null)
        setIsDeleteDialogOpen(false)
      } else {
        toast.error(res.error || 'Failed to delete project')
      }
    }
  })

  const { data: projectDetailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: ['project-detail', selectedProjectId],
    queryFn: () => getProjectById(selectedProjectId!),
    enabled: !!selectedProjectId,
    staleTime: 30_000,
  })

  const projects = projectsRes?.data || []
  const users = projectsRes?.users || []
  const filteredProjects = projects.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === null || p.status === statusFilter))
  
  const selectedProject = selectedProjectId ? projects.find((p: any) => p.id === selectedProjectId) : null
  const detailTasks = (projectDetailRes?.data?.tasks as any[]) ?? []

  return {
    selectedProjectId, setSelectedProjectId,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    isFormOpen, setIsFormOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    isArchiveDialogOpen, setIsArchiveDialogOpen,
    isContributorsOpen, setIsContributorsOpen,
    isKpiDialogOpen, setIsKpiDialogOpen,
    isLoading, projectsError, projects, users,
    filteredProjects, selectedProject,
    projectDetailRes, isDetailLoading, detailTasks,
    toggleFavorite, archiveMutation, duplicateMutation, exportMutation, deleteMutation
  }
}
