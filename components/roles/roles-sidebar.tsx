'use client'

import React from 'react'
import { Search, Shield } from 'lucide-react'

type RolesSidebarProps = {
  roles: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeRole: any
  setActiveRoleId: (id: number) => void
}

export function RolesSidebar({ roles, searchQuery, setSearchQuery, activeRole, setActiveRoleId }: RolesSidebarProps) {
  return (
    <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search roles..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="space-y-2">
        {roles.filter((r: any) => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((role: any) => (
          <button
            key={role.id}
            onClick={() => setActiveRoleId(role.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              activeRole?.id === role.id 
                ? 'bg-primary/10 border-primary/30 text-primary' 
                : 'bg-card border-border hover:border-primary/50 hover:bg-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-foreground">{role.name}</span>
              <Shield className={`size-3.5 ${activeRole?.id === role.id ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground line-clamp-1">{role._count?.users || 0} users assigned</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
