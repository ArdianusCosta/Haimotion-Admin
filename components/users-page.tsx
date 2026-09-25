'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Users as UsersIcon, UserCheck, UserMinus } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { User } from '@/types/user'
import { useUsers, useRoles } from '@/hooks/use-users'
import { UserTable } from '@/components/users/user-table'
import { UserFormDialog } from '@/components/users/dialogs/user-form-dialog'
import { UserDeleteDialog } from '@/components/users/dialogs/user-delete-dialog'
import { UserStatusDialog } from '@/components/users/dialogs/user-status-dialog'

export function UsersPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  
  // Selected user states
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [statusUser, setStatusUser] = useState<User | null>(null)

  // Debounce search query to prevent excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter])

  // Data fetching via custom hooks
  const { data, isLoading } = useUsers(page, limit, debouncedSearch, roleFilter)
  const { data: rolesData } = useRoles()
  
  const users: User[] = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
  const counts = data?.counts || { total: 0, admins: 0, employees: 0 }
  const rolesList: { id: number, name: string }[] = rolesData?.roles || []

  const openAddModal = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const openDeleteModal = (user: User) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const openStatusModal = (user: User) => {
    setStatusUser(user)
    setIsStatusModalOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('User Management')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage all registered users from the database.')}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Plus className="size-4" />
          {t('Add User')}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('All Users')}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{counts.total}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UsersIcon className="size-6" />
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Employee')}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{counts.employees}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="size-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Admin')}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{counts.admins}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <UserMinus className="size-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("Search users...")} 
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" 
            />
          </div>
          
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          >
            <option value="all">{t('All Roles')}</option>
            {rolesList.map(role => (
              <option key={role.id} value={role.id.toString()}>{role.name}</option>
            ))}
          </select>
        </div>

        <UserTable 
          users={users}
          isLoading={isLoading}
          pagination={pagination}
          page={page}
          setPage={setPage}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onStatusChange={openStatusModal}
        />
      </div>

      <UserFormDialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        user={editingUser} 
      />

      <UserDeleteDialog 
        open={isDeleteModalOpen} 
        onOpenChange={setIsDeleteModalOpen} 
        user={deletingUser} 
      />

      <UserStatusDialog 
        open={isStatusModalOpen} 
        onOpenChange={setIsStatusModalOpen} 
        user={statusUser} 
      />
    </div>
  )
}
