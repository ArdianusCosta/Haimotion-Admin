'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

type FileManagerStatsProps = {
  statsData: any
  isLoading?: boolean
  setFilter: (filter: string | null) => void
  setQuery: (query: string) => void
  setCurrentFolderId: (id: number | null) => void
}

export function FileManagerStats({ statsData, isLoading, setFilter, setQuery, setCurrentFolderId }: FileManagerStatsProps) {
  if (isLoading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 animate-in fade-in duration-500">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Storage used</p>
        <p className="mt-2 text-xl font-semibold">
          {statsData?.storageUsedGB ?? '0.0'} GB <span className="text-xs font-normal text-muted-foreground">/ {statsData?.maxStorageGB ?? 100} GB</span>
        </p>
        <div className="mt-3 h-2 rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-primary" 
            style={{ width: `${Math.min(100, ((statsData?.storageUsedGB || 0) / (statsData?.maxStorageGB || 100)) * 100)}%` }} 
          />
        </div>
      </div>
      <div 
        className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => { setFilter('shared'); setQuery(''); setCurrentFolderId(null); }}
      >
        <p className="text-xs text-muted-foreground">Shared with me</p>
        <p className="mt-2 text-xl font-semibold">
          {statsData?.sharedFilesCount ?? '--'} <span className="text-xs font-normal text-muted-foreground">files</span>
        </p>
      </div>
      <div 
        className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => { setFilter('recent'); setQuery(''); setCurrentFolderId(null); }}
      >
        <p className="text-xs text-muted-foreground">Recent activity</p>
        <p className="mt-2 text-xl font-semibold">
          {statsData?.recentActivityCount ?? '--'} <span className="text-xs font-normal text-muted-foreground">updates</span>
        </p>
      </div>
    </div>
  )
}
