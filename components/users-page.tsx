'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Users as UsersIcon, UserCheck, UserMinus, Eye, EyeOff } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'

type User = {
  id: number
  firstname: string
  lastname: string
  email: string
  notification_email: string | null
  type: number
  avatar: string
  date_created: string
  nik: string | null
  address: string | null
}

const roleColors: Record<number, { bg: string, text: string, label: string }> = {
  1: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', label: 'Admin / Mngmt' },
  2: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', label: 'Staff' },
  3: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Creative' },
  4: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', label: 'Client / Vendor' },
}

export function UsersPage() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 10
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', notification_email: '', type: '2', password: '', avatar: '', nik: '', address: '' })
  const [isUploading, setIsUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, debouncedSearch, roleFilter],
    queryFn: async () => {
      const res = await fetch(`/api/users?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}&role=${roleFilter}`)
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    }
  })

  const users: User[] = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
  const counts = data?.counts || { total: 0, admins: 0, employees: 0 }

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json()
    }
  })
  const rolesList: { id: number, name: string }[] = rolesData?.roles || []

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsModalOpen(false)
      toast.success(editingUser ? t("User updated successfully!") : t("User created successfully!"))
    },
    onError: (error) => {
      toast.error(`${t('Failed to save user')}: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDeleteModalOpen(false)
      toast.success(t("User deleted successfully!"))
    },
    onError: (error) => {
      toast.error(`${t('Failed to delete user')}: ${error.message}`)
    }
  })

  const openAddModal = () => {
    setEditingUser(null)
    setFormData({ firstname: '', lastname: '', email: '', notification_email: '', type: '2', password: '', avatar: '', nik: '', address: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({ 
      firstname: user.firstname, 
      lastname: user.lastname || '', 
      email: user.email, 
      notification_email: user.notification_email || '',
      type: String(user.type), 
      password: '', // Don't prefill password
      avatar: user.avatar || '',
      nik: user.nik || '',
      address: user.address || ''
    })
    setIsModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    const form = new FormData()
    form.append('file', file)
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await res.json()
      if (res.ok) {
        setFormData(prev => ({ ...prev, avatar: uploadData.url }))
        toast.success(t("Avatar uploaded successfully!"))
      } else {
        toast.error(t("Avatar upload failed!"))
      }
    } catch (error) {
      console.error(error)
      toast.error(t("Error uploading avatar file"))
    } finally {
      setIsUploading(false)
    }
  }

  const openDeleteModal = (user: User) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload: any = { ...formData }
    if (editingUser && !payload.password) delete payload.password // Don't send empty password on update
    
    saveMutation.mutate(payload)
  }

  const handleDelete = () => {
    if (!deletingUser) return
    deleteMutation.mutate(deletingUser.id)
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

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t('No.')}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t('Name')}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t('Email')}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t('Role Type')}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t('Joined At')}</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-in fade-in duration-500">
                      <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">{t('No users found.')}</td>
                  </tr>
                ) : (
                  users.map((user, index) => {
                    const dbRole = rolesList.find(r => r.id === user.type)
                    const roleColor = roleColors[user.type] || { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Unknown' }
                    const roleLabel = dbRole ? dbRole.name : roleColor.label
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-muted/50 group">
                        <td className="px-5 py-3 text-muted-foreground">{(page - 1) * limit + index + 1}</td>
                        <td className="px-5 py-3 font-medium text-foreground">{user.firstname} {user.lastname}</td>
                        <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(user.date_created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(user)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                              <Edit2 className="size-4" />
                            </button>
                            <button onClick={() => openDeleteModal(user)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!isLoading && users.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-4">
              <span className="text-sm text-muted-foreground">
                {t('Showing')} <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> {t('to')} <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> {t('of')} <strong>{pagination.total}</strong> {t('results')}
              </span>
              <div className="flex items-center gap-1 rounded-full bg-background border border-border p-1 shadow-sm">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                
                {Array.from({ length: pagination.totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${page === pageNum ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-0">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editingUser ? t('Edit User') : t('Add New User')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('First Name')} <span className="text-destructive">*</span></label>
                  <input required value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('Last Name')}</label>
                  <input value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('Email')} <span className="text-destructive">*</span></label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('Notification Email')}</label>
                  <input type="email" value={formData.notification_email} onChange={e => setFormData({...formData, notification_email: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('NIK')}</label>
                  <input value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium">{t('Avatar')}</label>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted/50 shadow-inner">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <UsersIcon className="size-6 opacity-50" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                          <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          title="Click to upload"
                        />
                        <button type="button" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted hover:text-foreground">
                          {t('Choose File')}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate w-[150px]">
                        {!isUploading && formData.avatar ? formData.avatar.split('/').pop() : t('JPG, PNG, GIF up to 5MB')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('Address')}</label>
                <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
              </div>
              


              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('Password')} {editingUser && <span className="text-xs text-muted-foreground font-normal">{t('(Leave empty to keep current)')}</span>}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? '••••••••' : t('Password...')} className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('Role Type')}</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50">
                  {rolesList.map(role => (
                    <option key={role.id} value={role.id.toString()}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">{t('Cancel')}</button>
                <button type="submit" disabled={saveMutation.isPending || isUploading} className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {(saveMutation.isPending || isUploading) && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {editingUser ? t('Save Changes') : t('Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <h2 className="text-lg font-semibold text-foreground">{t('Delete User?')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('Are you sure you want to delete')} <strong>{deletingUser?.firstname}</strong>? {t('This action cannot be undone.')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">{t('Cancel')}</button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
                {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : t('Yes, delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
