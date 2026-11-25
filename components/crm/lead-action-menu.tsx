'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Eye,
  Edit,
  UserCheck,
  Sparkles,
  XCircle,
  Trash
} from 'lucide-react'

export interface LeadActionItem {
  id: number
  name: string
  status: string
  pipeline_stage?: string
}

interface LeadActionMenuProps {
  lead: LeadActionItem
  onViewDetails: (id: number) => void
  onEdit: (lead: any) => void
  onConvert: (id: number) => void
  onMarkQualified: (id: number) => void
  onMarkLost: (id: number) => void
  onDelete: (lead: { id: number; name: string }) => void
}

export function LeadActionMenu({
  lead,
  onViewDetails,
  onEdit,
  onConvert,
  onMarkQualified,
  onMarkLost,
  onDelete
}: LeadActionMenuProps) {
  const isConverted = lead.status === 'Converted'
  const isLost = lead.status === 'Lost'
  const isQualified = lead.pipeline_stage === 'Qualified'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-80 group-hover:opacity-100 hover:bg-accent rounded-lg transition-all"
          aria-label="Lead Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg rounded-xl border-border/60">
        {/* View Details */}
        <DropdownMenuItem
          onClick={() => onViewDetails(lead.id)}
          className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
        >
          <Eye className="h-4 w-4 text-sky-500 shrink-0" />
          <span>View Details</span>
        </DropdownMenuItem>

        {/* Edit Lead */}
        <DropdownMenuItem
          onClick={() => onEdit(lead)}
          className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
        >
          <Edit className="h-4 w-4 text-violet-500 shrink-0" />
          <span>Edit Lead</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-border/40" />

        {/* Convert to Client & Deal */}
        {!isConverted && (
          <DropdownMenuItem
            onClick={() => onConvert(lead.id)}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Convert to Client & Deal</span>
          </DropdownMenuItem>
        )}

        {/* Mark as Qualified */}
        {!isQualified && !isConverted && (
          <DropdownMenuItem
            onClick={() => onMarkQualified(lead.id)}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Mark as Qualified</span>
          </DropdownMenuItem>
        )}

        {/* Mark as Lost */}
        {!isLost && !isConverted && (
          <DropdownMenuItem
            onClick={() => onMarkLost(lead.id)}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
          >
            <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Mark as Lost</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1 border-border/40" />

        {/* Delete */}
        <DropdownMenuItem
          onClick={() => onDelete({ id: lead.id, name: lead.name })}
          className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
        >
          <Trash className="h-4 w-4 shrink-0" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
