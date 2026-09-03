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
  ArrowLeft, Edit2, Play, Plus, Save, Share2, Sidebar, Eye, ShieldAlert, FileText, CheckCircle2, Copy, Trash2
} from 'lucide-react'
import { nodeTypes, FlowNodeData } from './flow-nodes'

// --- MOCK DATA ---
const initialNodes: Node<FlowNodeData>[] = [
  {
    id: 'n1',
    type: 'customNode',
    position: { x: 250, y: 50 },
    data: { label: 'Product Form', type: 'ui', tech: 'Next.js', status: 'completed', owner: 'Alice S.' }
  },
  {
    id: 'n2',
    type: 'customNode',
    position: { x: 250, y: 200 },
    data: { label: 'Validation', type: 'validation', tech: 'Zod', status: 'completed', owner: 'Alice S.' }
  },
  {
    id: 'n3',
    type: 'condition',
    position: { x: 285, y: 350 },
    data: { label: 'Is Valid?', type: 'condition' }
  },
  {
    id: 'n4',
    type: 'customNode',
    position: { x: 50, y: 450 },
    data: { label: 'Validation Error', type: 'ui', tech: 'Toast', status: 'completed', owner: 'Alice S.' }
  },
  {
    id: 'n5',
    type: 'customNode',
    position: { x: 450, y: 450 },
    data: { label: 'Product API', type: 'api', tech: 'Laravel', status: 'completed', owner: 'Costa', description: 'POST /api/products' }
  },
  {
    id: 'n6',
    type: 'customNode',
    position: { x: 450, y: 600 },
    data: { label: 'Product Service', type: 'service', tech: 'PHP', status: 'in-progress', owner: 'Costa', description: 'Business Logic for creating products' }
  },
  {
    id: 'n7',
    type: 'customNode',
    position: { x: 450, y: 750 },
    data: { label: 'Database', type: 'database', tech: 'PostgreSQL', status: 'planned', owner: 'Costa' }
  },
  {
    id: 'n8',
    type: 'customNode',
    position: { x: 450, y: 900 },
    data: { label: 'Response', type: 'api', tech: 'JSON', status: 'planned', owner: 'Costa' }
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
  { id: 'e2-3', source: 'n2', target: 'n3', animated: true },
  { id: 'e3-4', source: 'n3', sourceHandle: 'left', target: 'n4', label: 'No', style: { stroke: '#ef4444' } },
  { id: 'e3-5', source: 'n3', sourceHandle: 'right', target: 'n5', label: 'Yes', style: { stroke: '#22c55e' } },
  { id: 'e5-6', source: 'n5', target: 'n6' },
  { id: 'e6-7', source: 'n6', target: 'n7' },
  { id: 'e7-8', source: 'n7', target: 'n8' },
]

export function ModuleFlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length === 1) {
      setSelectedNode(nodes[0] as Node<FlowNodeData>)
      setIsPanelOpen(true)
    } else {
      setSelectedNode(null)
    }
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden bg-background border border-border rounded-xl shadow-sm relative">
      
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight">Product Creation Flow</h1>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">v1.4</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Module: Product Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
            <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
            Draft changes
          </div>
          
          <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <Plus className="size-3.5" />
            Add Step
          </button>
          
          <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
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
              onConnect={onConnect}
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
                    </div>
                  </div>
                </div>

                {/* Node Actions Footer */}
                <div className="pt-4 mt-6 border-t border-border flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-sm font-medium transition-colors">
                    <Edit2 className="size-4" /> Edit
                  </button>
                  <button className="p-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                    <Copy className="size-4" />
                  </button>
                  <button className="p-2 border border-border rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>

              </div>
            ) : (
              // Empty State / Project Overview
              <div className="p-5 flex flex-col h-full">
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-1">Product Module</h2>
                  <p className="text-sm text-muted-foreground">Module flow overview and checklist.</p>
                </div>

                <div className="space-y-6 flex-1">
                  
                  {/* Module Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Active</span>
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
                      <span className="text-xs font-bold text-primary">60%</span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-primary rounded-full w-[60%]" />
                    </div>

                    <div className="space-y-2">
                      {[
                        { label: 'Database schema created', done: true },
                        { label: 'API endpoints created', done: true },
                        { label: 'Validation implemented', done: true },
                        { label: 'Unit testing', done: false },
                        { label: 'E2E testing', done: false },
                        { label: 'Production deployment', done: false },
                      ].map((task, i) => (
                        <label key={i} className="flex items-center gap-3 group cursor-pointer">
                          <div className={`flex size-4 items-center justify-center rounded-full border transition-colors ${task.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background group-hover:border-primary'}`}>
                            {task.done && <CheckCircle2 className="size-3" />}
                          </div>
                          <span className={`text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {task.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-border">
                  <button className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Play className="size-4" /> Run Execution Test
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
