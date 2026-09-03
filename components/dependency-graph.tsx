'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarDays, GitBranch, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

// Simple CSS-based tree using flex and relative positioning.
// Nodes are visually connected by pseudo-elements and borders.

interface TaskNode {
  id: number
  task: string
  description: string
  status: number
  start_date: string | null
  end_date: string | null
  dependencies: string | null
  dependsOn: number[] // IDs this task depends on
}

export function DependencyGraph({ tasks }: { tasks: any[] }) {
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null)

  // Parse tasks and build a map
  const taskMap = new Map<number, TaskNode>()
  const nodes: TaskNode[] = tasks.map(t => {
    const dependsOn = t.dependencies 
      ? t.dependencies.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id))
      : []
    const node = { ...t, dependsOn }
    taskMap.set(t.id, node)
    return node
  })

  // Identify root nodes (nodes that don't depend on anything)
  const roots = nodes.filter(n => n.dependsOn.length === 0)
  
  // If no tasks, show empty state
  if (nodes.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground p-8 text-center">
        <GitBranch className="mb-4 size-8 opacity-20" />
        <p className="text-sm font-medium">No tasks found</p>
        <p className="text-xs">Create tasks in this project to see the dependency graph.</p>
      </div>
    )
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 5: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' // Completed
      case 2: return 'bg-blue-500/10 text-blue-500 border-blue-500/20' // In Progress
      case 0: return 'bg-amber-500/10 text-amber-500 border-amber-500/20' // Pending
      case 1: return 'bg-rose-500/10 text-rose-500 border-rose-500/20' // Blocked/External
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 5: return 'Completed'
      case 2: return 'In Progress'
      case 0: return 'Pending'
      case 1: return 'Blocked'
      default: return 'Unknown'
    }
  }

  // Recursive component to render a node and its children (tasks that depend on it)
  const renderNode = (node: TaskNode, level: number = 0) => {
    // Find children: tasks that depend on THIS node
    const children = nodes.filter(n => n.dependsOn.includes(node.id))
    
    return (
      <div key={node.id} className="relative flex flex-col items-center">
        {/* The Node Card */}
        <div 
          onClick={() => setSelectedTask(node)}
          className={`relative z-10 w-48 cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md ${
            node.status === 5 ? 'border-emerald-500/20' : 
            node.status === 2 ? 'border-blue-500/20' : 
            node.status === 0 ? 'border-amber-500/20' : 'border-border'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="outline" className={`text-[10px] uppercase ${getStatusColor(node.status)}`}>
              {getStatusLabel(node.status)}
            </Badge>
          </div>
          <h4 className="line-clamp-2 text-sm font-medium">{node.task}</h4>
          {node.end_date && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {new Date(node.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </div>
          )}
        </div>

        {/* The Children (recursively rendered) */}
        {children.length > 0 && (
          <div className="relative mt-8 flex justify-center gap-4 before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-border">
            {/* Top horizontal connector line if multiple children */}
            {children.length > 1 && (
              <div className="absolute -top-4 left-0 right-0 h-px bg-border" 
                   style={{ 
                     left: 'calc(25%)', // roughly half a node width
                     right: 'calc(25%)' 
                   }} 
              />
            )}
            
            {children.map(child => (
              <div key={child.id} className="relative pt-4 before:absolute before:-top-4 before:left-1/2 before:h-4 before:w-px before:bg-border">
                {renderNode(child, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <ScrollArea className="h-[500px] w-full rounded-xl border border-border bg-muted/10 p-6">
        <div className="flex min-w-max flex-wrap justify-center gap-12 p-4">
          {roots.map(root => renderNode(root))}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.task}</DialogTitle>
            <DialogDescription>
              Task ID: {selectedTask?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(selectedTask?.status || 0)}>
                {getStatusLabel(selectedTask?.status || 0)}
              </Badge>
              {selectedTask?.end_date && (
                <span className="text-sm text-muted-foreground">
                  Due: {new Date(selectedTask.end_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p dangerouslySetInnerHTML={{ __html: selectedTask?.description || 'No description provided.' }} />
            </div>
            
            {selectedTask?.dependsOn && selectedTask.dependsOn.length > 0 && (
              <div className="mt-4">
                <h5 className="mb-2 text-sm font-semibold">Depends On:</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.dependsOn.map(depId => {
                    const depTask = taskMap.get(depId)
                    return (
                      <Badge key={depId} variant="secondary">
                        {depTask ? depTask.task : `Unknown Task #${depId}`}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
