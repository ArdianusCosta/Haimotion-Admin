'use client'

import { useState } from 'react'
import { Plus, Shield, Search, MoreVertical, Edit2, Trash2, CheckCircle2 } from 'lucide-react'

const initialRoles = [
  { id: 1, name: 'Administrator', description: 'Full access to all system features and settings.', users: 3 },
  { id: 2, name: 'Developer', description: 'Can manage modules, flows, and API endpoints.', users: 8 },
  { id: 3, name: 'Editor', description: 'Can edit content but cannot manage users or settings.', users: 12 },
  { id: 4, name: 'Viewer', description: 'Read-only access to specific project data.', users: 24 },
]

const initialCategories = [
  {
    name: 'Module Flows',
    permissions: [
      { id: 'mf_view', name: 'View Flows', desc: 'Can view module flows in read-only mode' },
      { id: 'mf_create', name: 'Create Flows', desc: 'Can create new module flows' },
      { id: 'mf_edit', name: 'Edit Flows', desc: 'Can edit existing nodes and connections' },
      { id: 'mf_delete', name: 'Delete Flows', desc: 'Can delete entire module flows' },
    ]
  },
  {
    name: 'User Management',
    permissions: [
      { id: 'um_view', name: 'View Users', desc: 'Can view user directory' },
      { id: 'um_create', name: 'Invite Users', desc: 'Can invite new users to workspace' },
      { id: 'um_edit', name: 'Manage Roles', desc: 'Can change user roles and permissions' },
    ]
  },
  {
    name: 'Billing & Settings',
    permissions: [
      { id: 'set_view', name: 'View Settings', desc: 'Can view workspace settings' },
      { id: 'set_edit', name: 'Edit Settings', desc: 'Can modify workspace configuration' },
      { id: 'bil_manage', name: 'Manage Billing', desc: 'Can access invoices and payment methods' },
    ]
  }
]

export function RolesPermissionsPage() {
  const [activeRole, setActiveRole] = useState(initialRoles[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState(initialCategories)

  const addPermission = (categoryIndex: number) => {
    const permName = prompt("Enter new Permission Name (e.g. 'View Reports'):")
    if (!permName) return
    const permDesc = prompt("Enter Permission Description:")
    const newPermId = 'custom_' + Date.now()
    
    setCategories(prev => {
      const next = [...prev]
      next[categoryIndex] = {
        ...next[categoryIndex],
        permissions: [...next[categoryIndex].permissions, { id: newPermId, name: permName, desc: permDesc || '' }]
      }
      return next
    })
  }

  const [rolePermissions, setRolePermissions] = useState<Record<number, string[]>>({
    1: ['mf_view', 'mf_create', 'mf_edit', 'mf_delete', 'um_view', 'um_create', 'um_edit', 'set_view', 'set_edit', 'bil_manage'],
    2: ['mf_view', 'mf_create', 'mf_edit', 'mf_delete', 'um_view'],
    3: ['mf_view', 'um_view'],
    4: ['mf_view'],
  })

  const togglePermission = (roleId: number, permId: string) => {
    setRolePermissions(prev => {
      const current = prev[roleId] || []
      const hasPerm = current.includes(permId)
      return {
        ...prev,
        [roleId]: hasPerm ? current.filter(p => p !== permId) : [...current, permId]
      }
    })
  }

  const isChecked = (roleId: number, permId: string) => {
    return rolePermissions[roleId]?.includes(permId) || false
  }

  return (
    <div className="mx-auto max-w-6xl py-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage access control and security policies for your workspace.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm w-fit">
          <Plus className="size-4" />
          Create Custom Role
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Roles Sidebar */}
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
            {initialRoles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(role => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  activeRole.id === role.id 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">{role.name}</span>
                  <Shield className={`size-3.5 ${activeRole.id === role.id ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground line-clamp-1">{role.users} users assigned</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="flex-1 rounded-xl border border-border bg-card shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
          
          <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold">{activeRole.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{activeRole.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors" title="Edit Role Info"><Edit2 className="size-4" /></button>
              <button className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" disabled={activeRole.id === 1} title="Delete Role"><Trash2 className="size-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-8">
              {categories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category.name}</h3>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-border">
                        {category.permissions.map((perm) => {
                          const checked = isChecked(activeRole.id, perm.id)
                          return (
                            <tr key={perm.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => togglePermission(activeRole.id, perm.id)}>
                              <td className="p-4 w-12 text-center align-middle">
                                <div className={`relative flex size-5 items-center justify-center rounded border transition-colors ${
                                  checked 
                                    ? 'bg-primary border-primary text-primary-foreground' 
                                    : 'bg-background border-input'
                                }`}>
                                  {checked && <CheckCircle2 className="size-3.5" />}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <p className="font-medium text-foreground select-none">{perm.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 select-none">{perm.desc}</p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="p-3 border-t border-border bg-muted/20">
                      <button onClick={() => addPermission(idx)} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                        <Plus className="size-3.5" />
                        Add Permission
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}
