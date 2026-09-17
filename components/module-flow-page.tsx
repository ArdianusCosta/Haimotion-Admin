'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { 
  ArrowLeft, Edit2, Play, Plus, Save, Share2, Sidebar, Eye, ShieldAlert, FileText, CheckCircle2, Copy, Trash2, Loader2
} from 'lucide-react'
import { nodeTypes, FlowNodeData } from './flow-nodes'
import { useModuleFlowData, useUpdateNodePosition, useAddEdge, useAddNode, useUpdateNode, useDeleteNode, useDeleteEdge, useToggleChecklist, usePublishFlow, useRunExecution } from '@/hooks/use-module-flows'
import { NodeFormDialog } from './module-flow-dialogs'
import { ScheduleMeetingDialog } from '@/components/schedule-meeting-dialog'
import { Video } from 'lucide-react'

// Dynamic Data Handled by TanStack Query

export function ModuleFlowPage() {
  const { data: flowData, isLoading } = useModuleFlowData(1)
  const { mutate: updatePosition } = useUpdateNodePosition()
  const { mutate: createEdge } = useAddEdge()
  const { mutate: toggleChecklist } = useToggleChecklist()
  const { mutate: publishFlow } = usePublishFlow()
  const { mutate: runExecution } = useRunExecution()
  const { mutate: addNode, isPending: isAddingNode } = useAddNode()
  const { mutate: updateNode, isPending: isUpdatingNode } = useUpdateNode()
  const { mutate: deleteNode } = useDeleteNode()
  const { mutate: deleteEdge } = useDeleteEdge()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isAddStepOpen, setIsAddStepOpen] = useState(false)
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  const [isEditStepOpen, setIsEditStepOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null)

  React.useEffect(() => {
    if (flowData) {
      setNodes(flowData.nodes.map((n: any) => ({
        id: n.id,
        type: n.type === 'condition' ? 'condition' : 'customNode',
        position: { x: n.position_x, y: n.position_y },
        data: {
          label: n.label,
          type: n.type,
          tech: n.tech,
          status: isExecuting 
            ? (executingNodeId === n.id ? 'running' : 'pending')
            : n.status,
          owner: n.owner,
          description: n.description
        }
      })))
      
      setEdges(flowData.edges.map((e: any) => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        sourceHandle: e.source_handle,
        targetHandle: e.target_handle,
        label: e.label,
        style: e.color ? { stroke: e.color } : (isExecuting ? { stroke: '#3b82f6', strokeWidth: 2 } : undefined),
        animated: isExecuting ? true : e.animated
      })))
    }
  }, [flowData, setNodes, setEdges, isExecuting, executingNodeId])

  const onConnect = useCallback(
    (params: Connection) => {
      createEdge({
        flowId: 1,
        data: {
          source_id: params.source,
          target_id: params.target,
          source_handle: params.sourceHandle,
          target_handle: params.targetHandle
        }
      })
      setEdges((eds) => addEdge({ ...params, animated: true }, eds))
    },
    [setEdges, createEdge]
  )

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => {
        deleteEdge({ edgeId: edge.id, flowId: 1 })
      })
    },
    [deleteEdge]
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updatePosition({ nodeId: node.id, position: node.position })
    },
    [updatePosition]
  )

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length === 1) {
      setSelectedNode(nodes[0] as Node<FlowNodeData>)
      setIsPanelOpen(true)
    } else {
      setSelectedNode(null)
    }
  }, [])

  const handleRunExecution = async () => {
    if (!flowData || isExecuting) return
    setIsExecuting(true)
    
    // Simple visual simulation of traversing nodes
    for (const node of flowData.nodes) {
      setExecutingNodeId(node.id)
      await new Promise(resolve => setTimeout(resolve, 800)) // 800ms per node
    }
    
    setExecutingNodeId(null)
    setIsExecuting(false)
    runExecution(flowData.id)
  }

  if (isLoading || !flowData) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] w-full items-center justify-center bg-background border border-border rounded-xl shadow-sm">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden bg-background border border-border rounded-xl shadow-sm relative">
      <NodeFormDialog 
        isOpen={isAddStepOpen}
        onClose={() => setIsAddStepOpen(false)}
        onSubmit={(data) => {
          addNode({ flowId: flowData.id, data }, {
            onSuccess: () => setIsAddStepOpen(false)
          })
        }}
        isSubmitting={isAddingNode}
      />
      <NodeFormDialog 
        isOpen={isEditStepOpen}
        onClose={() => setIsEditStepOpen(false)}
        initialData={selectedNode ? {
          label: selectedNode.data.label,
          type: selectedNode.data.type,
          tech: selectedNode.data.tech,
          owner: selectedNode.data.owner,
          status: selectedNode.data.status,
          description: selectedNode.data.description,
          position_x: selectedNode.position.x,
          position_y: selectedNode.position.y
        } : null}
        onSubmit={(data) => {
          if (!selectedNode) return
          updateNode({ nodeId: selectedNode.id, flowId: flowData.id, data }, {
            onSuccess: () => {
              setIsEditStepOpen(false)
              // We could also update the local selectedNode to reflect changes immediately
              setSelectedNode((prev: any) => ({
                ...prev,
                data: { ...prev.data, ...data }
              }))
            }
          })
        }}
        isSubmitting={isUpdatingNode}
      />
      <ScheduleMeetingDialog 
        open={isScheduleMeetingOpen} 
        onOpenChange={setIsScheduleMeetingOpen} 
        defaultValues={{ moduleFlowId: flowData?.id }} 
      />
      
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight">{flowData.name}</h1>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{flowData.version}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {flowData.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {flowData.status === 'DRAFT' && (
            <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
              <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
              Draft changes
            </div>
          )}
          
          <button 
            onClick={() => setIsAddStepOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Plus className="size-3.5" />
            Add Step
          </button>
          
          <button 
            onClick={() => publishFlow(flowData.id)}
            disabled={flowData.status !== 'DRAFT'}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shadow-sm ${flowData.status === 'DRAFT' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            <Save className="size-3.5" />
            Publish
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Share Flow">
            <Share2 className="size-4" />
          </button>
          <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`p-1.5 rounded-lg transition-colors ${isPanelOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`} title="Toggle Details">
            <Sidebar className="size-4" />
          </button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 relative flex">
        
        {/* Main Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgesDelete={onEdgesDelete}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
              className="bg-muted/10"
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="currentColor" className="text-muted-foreground/20" />
              <Controls className="!bg-card !border-border !shadow-sm !rounded-lg overflow-hidden [&>button]:!border-b-border [&>button]:!bg-card [&>button]:!text-foreground hover:[&>button]:!bg-muted" />
              <MiniMap className="!bg-card !border-border !rounded-lg !shadow-sm hidden md:block" maskColor="rgba(var(--background), 0.5)" nodeColor="rgba(var(--primary), 0.5)" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* DETAILS SIDEBAR PANEL */}
        {isPanelOpen && (
          <div className="w-80 shrink-0 border-l border-border bg-card h-full overflow-y-auto flex flex-col absolute right-0 top-0 z-20 shadow-xl md:relative md:shadow-none animate-in slide-in-from-right-8 duration-300">
            {selectedNode ? (
              <div className="p-5 flex flex-col h-full">
                
                {/* Node Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedNode.data.type as string}
                      </span>
                      {selectedNode.data.status && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          {selectedNode.data.status as string}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold">{selectedNode.data.label as string}</h2>
                  </div>
                </div>

                {/* Node Properties */}
                <div className="space-y-5 flex-1">
                  
                  {selectedNode.data.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                      <p className="text-sm">{selectedNode.data.description as string}</p>
                    </div>
                  )}

                  {selectedNode.data.tech && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Technology</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-muted border border-border px-2 py-1 rounded text-sm font-medium">
                          {selectedNode.data.tech as string}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Owner / Assignee</p>
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {(selectedNode.data.owner as string || 'U').substring(0, 1)}
                      </div>
                      <span className="text-sm font-medium">{selectedNode.data.owner as string || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Mock Action/Links for the node */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resources</p>
                    <div className="space-y-2">
                      <button className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-muted text-sm transition-colors text-left">
                        <FileText className="size-4 text-muted-foreground" />
                        <span>View Documentation</span>
                      </button>
                      <button className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-muted text-sm transition-colors text-left">
                        <ShieldAlert className="size-4 text-muted-foreground" />
                        <span>View Open Issues (2)</span>
                      </button>
                      <button onClick={() => setIsScheduleMeetingOpen(true)} className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-primary/10 text-primary text-sm transition-colors text-left font-medium">
                        <Video className="size-4" />
                        <span>Schedule Related Meeting</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Node Actions Footer */}
                <div className="pt-4 mt-6 border-t border-border flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditStepOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit2 className="size-4" /> Edit
                    </button>
                    <button className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                      <Copy className="size-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('Are you sure you want to delete this step?')) {
                          deleteNode({ nodeId: selectedNode.id, flowId: flowData.id }, {
                            onSuccess: () => setSelectedNode(null)
                          })
                        }
                      }}
                      className="p-2 border border-border rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleRunExecution} 
                    disabled={isExecuting}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isExecuting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    {isExecuting ? 'Running Test...' : 'Run Execution Test'}
                  </button>
                </div>

              </div>
            ) : (
              // Empty State / Project Overview
              <div className="p-5 flex flex-col h-full">
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">{flowData.name}</h2>
                  <p className="text-sm text-muted-foreground">{flowData.description}</p>
                </div>

                <div className="space-y-6 flex-1">
                  
                  {/* Module Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${flowData.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className="text-sm font-medium">{flowData.status}</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Nodes</p>
                      <p className="text-sm font-medium">{nodes.length} Items</p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist Progress</p>
                      <span className="text-xs font-bold text-primary">{flowData.progress}%</span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${flowData.progress}%` }} />
                    </div>

                    <div className="space-y-2">
                      {flowData.checklists.map((task: any) => (
                        <label 
                          key={task.id} 
                          className="flex items-center gap-3 group cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleChecklist({ itemId: task.id, flowId: flowData.id, isDone: !task.is_done })
                          }}
                        >
                          <div className={`flex size-4 items-center justify-center rounded-full border transition-colors ${task.is_done ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background group-hover:border-primary'}`}>
                            {task.is_done && <CheckCircle2 className="size-3" />}
                          </div>
                          <span className={`text-sm ${task.is_done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {task.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Execution History */}
                  {flowData.executions && flowData.executions.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Executions</p>
                      <div className="space-y-2">
                        {flowData.executions.map((exec: any) => (
                          <div key={exec.id} className="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${exec.status === 'PASSED' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-xs font-medium text-foreground">Run #{exec.id}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(exec.created_at).toLocaleDateString()} {new Date(exec.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="pt-4 mt-6 border-t border-border">
                  <button 
                    onClick={handleRunExecution} 
                    disabled={isExecuting}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isExecuting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    {isExecuting ? 'Running Test...' : 'Run Execution Test'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
