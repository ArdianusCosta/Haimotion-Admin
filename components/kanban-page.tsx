'use client'

import { KanbanProvider } from './kanban/kanban-provider'
import { KanbanHeader } from './kanban/kanban-header'
import { KanbanBoard } from './kanban/kanban-board'
import { KanbanTaskDialog } from './kanban/dialogs/kanban-task-dialog'

export function KanbanContent() {
  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] flex-col gap-6">
      <KanbanHeader />
      <KanbanBoard />
      <KanbanTaskDialog />
    </div>
  )
}

export function KanbanPage() {
  return (
    <KanbanProvider>
      <KanbanContent />
    </KanbanProvider>
  )
}

export default KanbanPage
