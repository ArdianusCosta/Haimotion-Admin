'use client'

import React from 'react'
import { useProjects } from './project/hooks/use-projects'
import { ProjectListView } from './project/components/project-list-view'
import { ProjectDetailView } from './project/components/project-detail-view'

export function ProjectPage() {
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

  if (projectsError) {
    console.error("Projects Fetch Error:", projectsError)
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
    />
  )
}

export default ProjectPage
