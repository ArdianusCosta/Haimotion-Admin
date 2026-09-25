'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { 
  useRoles, 
  usePermissions, 
  useAllUsers, 
  useUpdateRolePerms, 
  useCreatePerm, 
  useUpdatePerm, 
  useDeletePerm, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole, 
  useAssignUserRole 
} from '@/hooks/use-roles-permissions'
import { 
  PermModalState, DeleteModalState, RoleModalState, DeleteRoleConfirmState,
  PermissionModal, DeletePermissionModal, RoleModal, DeleteRoleModal, AddCategoryModal, AssignUsersModal 
} from './roles/dialogs/roles-dialogs'
import { RolesSidebar } from './roles/roles-sidebar'
import { PermissionsPanel } from './roles/permissions-panel'

export function RolesPermissionsPage() {
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // Modals state
  const [permModal, setPermModal] = useState<PermModalState>({ open: false, mode: 'add', category: '', name: '', desc: '' })
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ open: false, permId: '', name: '' })
  const [roleModal, setRoleModal] = useState<RoleModalState>({ open: false, mode: 'add', name: '', desc: '' })
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<DeleteRoleConfirmState>({ open: false, id: -1, name: '' })
  const [addCategoryModal, setAddCategoryModal] = useState({ open: false, name: '' })
  const [assignUsersModal, setAssignUsersModal] = useState({ open: false })

  // Data fetching
  const { data: rolesData, isLoading: rolesLoading } = useRoles()
  const { data: permsData, isLoading: permsLoading } = usePermissions()
  const { data: usersData, isLoading: usersLoading } = useAllUsers(assignUsersModal.open)

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
  const updateRolePermsMutation = useUpdateRolePerms()
  const createPermMutation = useCreatePerm(() => setPermModal(prev => ({ ...prev, open: false })))
  const updatePermMutation = useUpdatePerm(() => setPermModal(prev => ({ ...prev, open: false })))
  const deletePermMutation = useDeletePerm(() => setDeleteModal(prev => ({ ...prev, open: false })))
  const createRoleMutation = useCreateRole((data) => {
    setRoleModal(prev => ({ ...prev, open: false }))
    setActiveRoleId(data.role.id)
  })
  const updateRoleMutation = useUpdateRole(() => setRoleModal(prev => ({ ...prev, open: false })))
  const deleteRoleMutation = useDeleteRole(() => {
    setDeleteRoleConfirm(prev => ({ ...prev, open: false }))
    if (activeRoleId === deleteRoleConfirm.id) {
      setActiveRoleId(null)
    }
  })
  const assignUserMutation = useAssignUserRole()

  // Handlers
  const togglePermission = (permId: string) => {
    if (!activeRole) return
    const current = [...activeRolePermissions]
    const hasPerm = current.includes(permId)
    const newPerms = hasPerm ? current.filter(p => p !== permId) : [...current, permId]
    
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
        <RolesSidebar 
          roles={roles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeRole={activeRole}
          setActiveRoleId={setActiveRoleId}
        />

        <PermissionsPanel 
          activeRole={activeRole}
          categories={categories}
          isChecked={isChecked}
          togglePermission={togglePermission}
          setRoleModal={setRoleModal}
          setDeleteRoleConfirm={setDeleteRoleConfirm}
          setAssignUsersModal={setAssignUsersModal}
          setAddCategoryModal={setAddCategoryModal}
          setPermModal={setPermModal}
          setDeleteModal={setDeleteModal}
        />
      </div>

      {/* Dialogs */}
      <PermissionModal 
        modal={permModal} 
        setModal={setPermModal} 
        onSave={handleSavePerm} 
        isPending={createPermMutation.isPending || updatePermMutation.isPending} 
      />

      <DeletePermissionModal 
        modal={deleteModal} 
        setModal={setDeleteModal} 
        onDelete={(id) => deletePermMutation.mutate(id)} 
        isPending={deletePermMutation.isPending} 
      />

      <RoleModal 
        modal={roleModal} 
        setModal={setRoleModal} 
        onSave={handleSaveRole} 
        isPending={createRoleMutation.isPending || updateRoleMutation.isPending} 
      />

      <DeleteRoleModal 
        modal={deleteRoleConfirm} 
        setModal={setDeleteRoleConfirm} 
        onDelete={(id) => deleteRoleMutation.mutate(id)} 
        isPending={deleteRoleMutation.isPending} 
      />

      <AddCategoryModal 
        modal={addCategoryModal} 
        setModal={setAddCategoryModal} 
        onCreate={(name) => {
          setAddCategoryModal({ open: false, name: '' })
          setPermModal({ open: true, mode: 'add', category: name, name: '', desc: '' })
        }} 
      />

      <AssignUsersModal 
        modal={assignUsersModal}
        setModal={setAssignUsersModal}
        activeRole={activeRole}
        usersData={usersData}
        usersLoading={usersLoading}
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        assignUser={(userId, roleId) => assignUserMutation.mutate({ userId, roleId })}
      />
    </div>
  )
}
