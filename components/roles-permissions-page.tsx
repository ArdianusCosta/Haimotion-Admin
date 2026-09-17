'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Shield, Search, Edit2, Trash2, CheckCircle2, X, Loader2, Users } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function RolesPermissionsPage() {
  const queryClient = useQueryClient()
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [permModal, setPermModal] = useState<{ open: boolean; mode: 'add' | 'edit'; category: string; permId?: string; name: string; desc: string }>({ open: false, mode: 'add', category: '', name: '', desc: '' })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; permId: string; name: string }>({ open: false, permId: '', name: '' })
  const [roleModal, setRoleModal] = useState<{ open: boolean; mode: 'add' | 'edit'; id?: number; name: string; desc: string }>({ open: false, mode: 'add', name: '', desc: '' })
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: -1, name: '' })
  const [addCategoryModal, setAddCategoryModal] = useState({ open: false, name: '' })
  const [assignUsersModal, setAssignUsersModal] = useState({ open: false })
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // Data fetching
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json()
    }
  })

  const { data: permsData, isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await fetch('/api/permissions')
      if (!res.ok) throw new Error('Failed to fetch permissions')
      return res.json()
    }
  })

  // Users query for assigning to roles
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      // Fetching all users by setting limit to a high number for now
      const res = await fetch('/api/users?limit=1000')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    enabled: assignUsersModal.open
  })

  const roles = rolesData?.roles || []
  const allPermissions = permsData?.permissions || []

  // Ensure active role is set when roles load
  useEffect(() => {
    if (roles.length > 0 && !activeRoleId) {
      setActiveRoleId(roles[0].id)
    }
  }, [roles, activeRoleId])

  const activeRole = useMemo(() => roles.find((r: any) => r.id === activeRoleId) || roles[0], [roles, activeRoleId])

  // Group permissions into categories
  const categories = useMemo(() => {
    const grouped = allPermissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.category]) {
        acc[perm.category] = { name: perm.category, permissions: [] }
      }
      acc[perm.category].permissions.push({ id: perm.id, name: perm.name, desc: perm.description })
      return acc
    }, {})
    
    // Convert to array and sort
    return Object.values(grouped).sort((a: any, b: any) => a.name.localeCompare(b.name)) as { name: string, permissions: any[] }[]
  }, [allPermissions])

  // Current Role's checked permissions
  const activeRolePermissions = useMemo(() => {
    if (!activeRole?.permissions) return []
    return activeRole.permissions.map((p: any) => p.permission)
  }, [activeRole])

  // Mutations
  const updateRolePermsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number, permissions: string[] }) => {
      const res = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })
      if (!res.ok) throw new Error('Failed to update permissions')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
  })

  const createPermMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create permission')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      setPermModal(prev => ({ ...prev, open: false }))
    }
  })

  const updatePermMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/permissions/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update permission')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      setPermModal(prev => ({ ...prev, open: false }))
    }
  })

  const deletePermMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/permissions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete permission')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteModal(prev => ({ ...prev, open: false }))
    }
  })

  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create role')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setRoleModal(prev => ({ ...prev, open: false }))
      setActiveRoleId(data.role.id)
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/roles/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setRoleModal(prev => ({ ...prev, open: false }))
    }
  })

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteRoleConfirm(prev => ({ ...prev, open: false }))
      if (activeRoleId === deleteRoleConfirm.id) {
        setActiveRoleId(null)
      }
    },
    onError: (error) => {
      alert(error.message)
    }
  })

  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number, roleId: number | null }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId })
      })
      if (!res.ok) throw new Error('Failed to update user role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] }) // to update the user counts
    }
  })

  // Handlers
  const togglePermission = (permId: string) => {
    if (!activeRole) return
    const current = [...activeRolePermissions]
    const hasPerm = current.includes(permId)
    const newPerms = hasPerm ? current.filter(p => p !== permId) : [...current, permId]
    
    // Optimistic-like behavior via React Query can be complex, we'll just mutate directly
    updateRolePermsMutation.mutate({ roleId: activeRole.id, permissions: newPerms })
  }

  const isChecked = (permId: string) => {
    return activeRolePermissions.includes(permId)
  }

  const handleSavePerm = () => {
    if (!permModal.name.trim()) return
    const id = permModal.mode === 'add' ? `${permModal.category.toLowerCase().replace(/\\s+/g, '_')}.${Date.now()}` : permModal.permId
    
    const payload = {
      id,
      category: permModal.category,
      name: permModal.name,
      description: permModal.desc
    }
    
    if (permModal.mode === 'add') {
      createPermMutation.mutate(payload)
    } else {
      updatePermMutation.mutate(payload)
    }
  }

  const handleSaveRole = () => {
    if (!roleModal.name.trim()) return
    if (roleModal.mode === 'add') {
      createRoleMutation.mutate({ name: roleModal.name, description: roleModal.desc })
    } else {
      updateRoleMutation.mutate({ id: roleModal.id, name: roleModal.name, description: roleModal.desc })
    }
  }

  if (rolesLoading || permsLoading) {
    return <div className="flex h-[500px] items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl py-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage access control and security policies for your workspace.</p>
        </div>
        <button onClick={() => setRoleModal({ open: true, mode: 'add', name: '', desc: '' })} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm w-fit">
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

        {/* Permissions Panel */}
        {activeRole && (
          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
            
            <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3">
                  {activeRole.name}
                  {activeRole.name !== 'Administrator' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setRoleModal({ open: true, mode: 'edit', id: activeRole.id, name: activeRole.name, desc: activeRole.description || '' })} className="p-1 text-muted-foreground hover:bg-muted rounded-md transition-colors" title="Edit Role">
                        <Edit2 className="size-3.5" />
                      </button>
                      <button onClick={() => setDeleteRoleConfirm({ open: true, id: activeRole.id, name: activeRole.name })} className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Delete Role">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{activeRole.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAssignUsersModal({ open: true })} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                  <Users className="size-3.5" />
                  Assign Users
                </button>
                <button onClick={() => setAddCategoryModal({ open: true, name: '' })} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                  <Plus className="size-3.5" />
                  Add Category
                </button>
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
                            const checked = isChecked(perm.id)
                            return (
                              <tr key={perm.id} className="group hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => togglePermission(perm.id)}>
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
                                <td className="p-4 text-right align-middle opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setPermModal({ open: true, mode: 'edit', category: category.name, permId: perm.id, name: perm.name, desc: perm.desc }) }} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors" title="Edit Permission">
                                      <Edit2 className="size-3.5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, permId: perm.id, name: perm.name }) }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Delete Permission">
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {category.permissions.length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-sm text-muted-foreground">
                                No permissions in this category yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="p-3 border-t border-border bg-muted/20">
                        <button onClick={() => setPermModal({ open: true, mode: 'add', category: category.name, name: '', desc: '' })} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                          <Plus className="size-3.5" />
                          Add Permission
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No categories found. Click "Add Category" to create one.
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>

      {/* Permission Add/Edit Modal */}
      {permModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{permModal.mode === 'add' ? 'Add Permission' : 'Edit Permission'}</h3>
              <button onClick={() => setPermModal(prev => ({ ...prev, open: false }))} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <input 
                  type="text" 
                  value={permModal.category} 
                  disabled
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Permission Name</label>
                <input 
                  type="text" 
                  value={permModal.name} 
                  onChange={e => setPermModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. View Reports"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea 
                  value={permModal.desc} 
                  onChange={e => setPermModal(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="What does this permission allow?"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPermModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSavePerm} disabled={!permModal.name.trim() || createPermMutation.isPending || updatePermMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {(createPermMutation.isPending || updatePermMutation.isPending) && <Loader2 className="size-3 animate-spin" />}
                {permModal.mode === 'add' ? 'Add Permission' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Permission</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteModal.name}"</span>? This action cannot be undone and will remove it from all roles.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => deletePermMutation.mutate(deleteModal.permId)} disabled={deletePermMutation.isPending} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                {deletePermMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{roleModal.mode === 'add' ? 'Create Custom Role' : 'Edit Role'}</h3>
              <button onClick={() => setRoleModal(prev => ({ ...prev, open: false }))} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Role Name</label>
                <input 
                  type="text" 
                  value={roleModal.name} 
                  onChange={e => setRoleModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Marketing Manager"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea 
                  value={roleModal.desc} 
                  onChange={e => setRoleModal(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="Describe the purpose of this role"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRoleModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveRole} disabled={!roleModal.name.trim() || createRoleMutation.isPending || updateRoleMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {(createRoleMutation.isPending || updateRoleMutation.isPending) && <Loader2 className="size-3 animate-spin" />}
                {roleModal.mode === 'add' ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      {deleteRoleConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Role</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete the role <span className="font-semibold text-foreground">"{deleteRoleConfirm.name}"</span>? 
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteRoleConfirm(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteRoleMutation.mutate(deleteRoleConfirm.id)} disabled={deleteRoleMutation.isPending} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                {deleteRoleMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal (Simulated via a new custom permission) */}
      {addCategoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add Category</h3>
              <button onClick={() => setAddCategoryModal({ open: false, name: '' })} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category Name</label>
                <input 
                  type="text" 
                  value={addCategoryModal.name} 
                  onChange={e => setAddCategoryModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Project Permissions"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setAddCategoryModal({ open: false, name: '' })} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => { setAddCategoryModal({ open: false, name: '' }); setPermModal({ open: true, mode: 'add', category: addCategoryModal.name, name: '', desc: '' }) }} disabled={!addCategoryModal.name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {assignUsersModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[600px] max-h-[90vh]">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h3 className="text-lg font-semibold">Assign Users to {activeRole?.name}</h3>
                <p className="text-sm text-muted-foreground">Select users who should have this role.</p>
              </div>
              <button onClick={() => setAssignUsersModal({ open: false })} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {usersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : (
                usersData?.data
                  ?.filter((u: any) => 
                    u.firstname.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                    u.lastname?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map((user: any) => {
                    const isAssigned = user.role_id === activeRole?.id;
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.firstname} {user.lastname}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                        <button 
                          onClick={() => assignUserMutation.mutate({ userId: user.id, roleId: isAssigned ? null : activeRole!.id })}
                          disabled={assignUserMutation.isPending}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                            isAssigned 
                              ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20' 
                              : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                          }`}
                        >
                          {isAssigned ? 'Remove' : 'Assign'}
                        </button>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
