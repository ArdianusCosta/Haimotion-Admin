'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useProjects } from './project/hooks/use-projects'
import { ProjectListView } from './project/components/project-list-view'
import { ProjectDetailView } from './project/components/project-detail-view'
import { CreateProjectPage } from './project/components/create-project-page'
import { EditProjectPage } from './project/components/edit-project-page'

export function ProjectPage({ slug }: { slug?: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCreatingInternal, setIsCreatingInternal] = useState(false)
  const [isEditingInternal, setIsEditingInternal] = useState(false)

  const {
    selectedProjectId, setSelectedProjectId,
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
  } = useProjects()

  // Sync route slug to selectedProjectId if navigating directly (e.g. /project/123)
  useEffect(() => {
    if (slug && slug.length >= 2 && !isNaN(Number(slug[1])) && !selectedProjectId) {
      setSelectedProjectId(Number(slug[1]))
    }
  }, [slug, selectedProjectId, setSelectedProjectId])

  if (projectsError) {
    console.error("Projects Fetch Error:", projectsError)
  }

  // Determine if we should show the Create Project page
  const isCreating = isCreatingInternal ||
    pathname === '/project/create' ||
    pathname === '/project/new' ||
    pathname === '/projects/create' ||
    pathname === '/projects/new' ||
    Boolean(slug && (slug[1] === 'create' || slug[1] === 'new'))

  // Determine if we should show the Edit Project page
  const editMatch = pathname ? pathname.match(/^\/projects?\/(\d+)\/edit$/) : null
  const isEditingFromUrl = Boolean(editMatch) || Boolean(slug && slug.length >= 3 && slug[2] === 'edit')
  const editingId = editMatch
    ? parseInt(editMatch[1])
    : (slug && slug.length >= 3 && slug[2] === 'edit' ? parseInt(slug[1]) : selectedProjectId)

  const isEditing = isEditingInternal || isEditingFromUrl
  const projectToEdit = selectedProject || (editingId ? projects.find((p: any) => p.id === editingId) : null)

  const handleNewProject = () => {
    setIsCreatingInternal(true)
    setIsEditingInternal(false)
    router.push('/project/create')
  }

  const handleBackFromCreate = () => {
    setIsCreatingInternal(false)
    router.push('/project')
  }

  const handleEditProject = (projId?: number) => {
    const id = projId || selectedProjectId
    if (id) {
      setSelectedProjectId(id)
      setIsEditingInternal(true)
      setIsCreatingInternal(false)
      router.push(`/project/${id}/edit`)
    }
  }

  const handleBackFromEdit = () => {
    setIsEditingInternal(false)
    router.push('/project')
  }

  const handleSavedFromEdit = () => {
    setIsEditingInternal(false)
    router.push('/project')
  }

  // Render Dedicated Create Project Page
  if (isCreating) {
    return (
      <CreateProjectPage 
        users={users} 
        onBack={handleBackFromCreate} 
      />
    )
  }

  // Render Dedicated Edit Project Page
  if (isEditing) {
    return (
      <EditProjectPage
        project={projectToEdit}
        projectId={editingId || selectedProjectId || undefined}
        users={users}
        onBack={handleBackFromEdit}
        onSaved={handleSavedFromEdit}
      />
    )
  }

  // Render List View
  if (!selectedProjectId) {
    return (
      <ProjectListView 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsFormOpen={setIsFormOpen}
        isFormOpen={isFormOpen}
        isLoading={isLoading}
        filteredProjects={filteredProjects}
        setSelectedProjectId={setSelectedProjectId}
        users={users}
        onNewProject={handleNewProject}
      />
    )
  }

  // Detail View
  if (!selectedProject) return null

  return (
    <ProjectDetailView 
      selectedProject={selectedProject}
      setSelectedProjectId={setSelectedProjectId}
      toggleFavorite={toggleFavorite}
      setIsFormOpen={setIsFormOpen}
      setIsDeleteDialogOpen={setIsDeleteDialogOpen}
      duplicateMutation={duplicateMutation}
      setIsArchiveDialogOpen={setIsArchiveDialogOpen}
      exportMutation={exportMutation}
      isDetailLoading={isDetailLoading}
      detailTasks={detailTasks}
      projectDetailRes={projectDetailRes}
      isKpiDialogOpen={isKpiDialogOpen}
      setIsKpiDialogOpen={setIsKpiDialogOpen}
      isContributorsOpen={isContributorsOpen}
      setIsContributorsOpen={setIsContributorsOpen}
      isFormOpen={isFormOpen}
      isDeleteDialogOpen={isDeleteDialogOpen}
      deleteMutation={deleteMutation}
      isArchiveDialogOpen={isArchiveDialogOpen}
      archiveMutation={archiveMutation}
      users={users}
      onEditProject={() => handleEditProject(selectedProject.id)}
    />
  )
}

export default ProjectPage
