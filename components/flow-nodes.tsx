'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Database, Server, LayoutTemplate, ShieldCheck, TestTube2, CloudLightning, FileText, CheckCircle2, SplitSquareHorizontal, CircleDot } from 'lucide-react'

// Define the Node Data Interface
export interface FlowNodeData {
  label: string
  type: 'database' | 'api' | 'service' | 'ui' | 'validation' | 'testing' | 'deployment' | 'documentation' | 'milestone' | 'condition' | 'custom'
  tech?: string
  status?: 'completed' | 'in-progress' | 'planned' | 'error'
  owner?: string
  description?: string
}

// Icon mapper
const getIconForType = (type: FlowNodeData['type']) => {
  switch (type) {
    case 'database': return Database
    case 'api': return Server
    case 'service': return CloudLightning
    case 'ui': return LayoutTemplate
    case 'validation': return ShieldCheck
    case 'testing': return TestTube2
    case 'deployment': return CircleDot
    case 'documentation': return FileText
    case 'milestone': return CheckCircle2
    case 'condition': return SplitSquareHorizontal
    default: return CircleDot
  }
}

const getColorClasses = (type: FlowNodeData['type']) => {
  switch (type) {
    case 'database': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'api': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'service': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    case 'ui': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'validation': return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'testing': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'condition': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    default: return 'bg-primary/10 text-primary border-primary/20'
  }
}

const getStatusIndicator = (status?: FlowNodeData['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-500'
    case 'in-progress': return 'bg-blue-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-zinc-400'
  }
}

// Main Custom Node Component
export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const Icon = getIconForType(data.type as FlowNodeData['type'])
  const colors = getColorClasses(data.type as FlowNodeData['type'])
  const statusColor = getStatusIndicator(data.status as FlowNodeData['status'])

  // Render a Condition (Diamond/Branch) Node Differently
  if (data.type === 'condition') {
    return (
      <div className={`relative flex items-center justify-center p-4 rounded-xl border-2 bg-card min-w-[120px] transition-all shadow-sm ${selected ? 'border-primary ring-4 ring-primary/20 shadow-md' : 'border-border hover:border-primary/50'}`}>
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground !border-background" />
        <div className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
          <SplitSquareHorizontal className="size-4 text-muted-foreground" />
          {data.label as string}
        </div>
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-muted-foreground !border-background" />
        <Handle type="source" position={Position.Left} id="left" className="!w-3 !h-3 !bg-muted-foreground !border-background" />
        <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-muted-foreground !border-background" />
      </div>
    )
  }

  // Standard Standard SaaS Card Node
  return (
    <div className={`relative flex flex-col w-[260px] rounded-xl border bg-card transition-all overflow-hidden ${selected ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-border shadow-sm hover:border-primary/50'}`}>
      
      {/* Target Handle (Input) */}
      <Handle type="target" position={Position.Top} className="!w-16 !h-1.5 !rounded-full !bg-muted-foreground !border-none !top-[-3px]" />

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${colors}`}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{data.label as string}</h3>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{data.type as string}</p>
            </div>
          </div>
          {data.status && (
            <div className="flex items-center gap-1.5 bg-muted/50 pl-1.5 pr-2 py-1 rounded-full border border-border/50 shrink-0">
              <span className={`size-1.5 rounded-full ${statusColor}`} />
              <span className="text-[10px] font-medium capitalize text-muted-foreground">{data.status as string}</span>
            </div>
          )}
        </div>

        {/* Content */}
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {data.description as string}
          </p>
        )}

        {/* Footer info */}
        {(data.tech || data.owner) && (
          <div className="flex items-center gap-3 pt-2 mt-1 border-t border-border/50">
            {data.tech && (
              <span className="text-[11px] font-semibold text-foreground/80 bg-muted px-2 py-0.5 rounded-md border border-border/50">
                {data.tech as string}
              </span>
            )}
            {data.owner && (
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                  {(data.owner as string).substring(0, 1)}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[80px]">
                  {data.owner as string}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Source Handle (Output) */}
      <Handle type="source" position={Position.Bottom} className="!w-16 !h-1.5 !rounded-full !bg-muted-foreground !border-none !bottom-[-3px]" />
    </div>
  )
})

export const nodeTypes = {
  customNode: CustomNode
}
