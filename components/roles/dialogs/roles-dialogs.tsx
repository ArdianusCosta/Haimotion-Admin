'use client'

import React from 'react'
import { X, Loader2, Search } from 'lucide-react'

// --- Types ---
export type PermModalState = { open: boolean; mode: 'add' | 'edit'; category: string; permId?: string; name: string; desc: string }
export type DeleteModalState = { open: boolean; permId: string; name: string }
export type RoleModalState = { open: boolean; mode: 'add' | 'edit'; id?: number; name: string; desc: string }
export type DeleteRoleConfirmState = { open: boolean; id: number; name: string }

// --- Permission Modal ---
export function PermissionModal({ 
  modal, setModal, onSave, isPending 
}: { 
  modal: PermModalState, setModal: React.Dispatch<React.SetStateAction<PermModalState>>, 
  onSave: () => void, isPending: boolean 
}) {
  if (!modal.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{modal.mode === 'add' ? 'Add Permission' : 'Edit Permission'}</h3>
          <button onClick={() => setModal(prev => ({ ...prev, open: false }))} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Category</label>
            <input 
              type="text" 
              value={modal.category} 
              disabled
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Permission Name</label>
            <input 
              type="text" 
              value={modal.name} 
              onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. View Reports"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea 
              value={modal.desc} 
              onChange={e => setModal(prev => ({ ...prev, desc: e.target.value }))}
              placeholder="What does this permission allow?"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={!modal.name.trim() || isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isPending && <Loader2 className="size-3 animate-spin" />}
            {modal.mode === 'add' ? 'Add Permission' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Delete Permission Modal ---
export function DeletePermissionModal({ 
  modal, setModal, onDelete, isPending 
}: { 
  modal: DeleteModalState, setModal: React.Dispatch<React.SetStateAction<DeleteModalState>>, 
  onDelete: (id: string) => void, isPending: boolean 
}) {
  if (!modal.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Permission</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <span className="font-semibold text-foreground">"{modal.name}"</span>? This action cannot be undone and will remove it from all roles.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={() => onDelete(modal.permId)} disabled={isPending} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50">
            {isPending && <Loader2 className="size-3 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Role Modal ---
export function RoleModal({ 
  modal, setModal, onSave, isPending 
}: { 
  modal: RoleModalState, setModal: React.Dispatch<React.SetStateAction<RoleModalState>>, 
  onSave: () => void, isPending: boolean 
}) {
  if (!modal.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{modal.mode === 'add' ? 'Create Custom Role' : 'Edit Role'}</h3>
          <button onClick={() => setModal(prev => ({ ...prev, open: false }))} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Role Name</label>
            <input 
              type="text" 
              value={modal.name} 
              onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Marketing Manager"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea 
              value={modal.desc} 
              onChange={e => setModal(prev => ({ ...prev, desc: e.target.value }))}
              placeholder="Describe the purpose of this role"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={!modal.name.trim() || isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending && <Loader2 className="size-3 animate-spin" />}
            {modal.mode === 'add' ? 'Create Role' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Delete Role Modal ---
export function DeleteRoleModal({ 
  modal, setModal, onDelete, isPending 
}: { 
  modal: DeleteRoleConfirmState, setModal: React.Dispatch<React.SetStateAction<DeleteRoleConfirmState>>, 
  onDelete: (id: number) => void, isPending: boolean 
}) {
  if (!modal.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Role</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete the role <span className="font-semibold text-foreground">"{modal.name}"</span>? 
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={() => onDelete(modal.id)} disabled={isPending} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2 disabled:opacity-50">
            {isPending && <Loader2 className="size-3 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Add Category Modal ---
export function AddCategoryModal({ 
  modal, setModal, onCreate 
}: { 
  modal: { open: boolean, name: string }, setModal: React.Dispatch<React.SetStateAction<{ open: boolean, name: string }>>, 
  onCreate: (name: string) => void 
}) {
  if (!modal.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Add Category</h3>
          <button onClick={() => setModal({ open: false, name: '' })} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Category Name</label>
            <input 
              type="text" 
              value={modal.name} 
              onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Project Permissions"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModal({ open: false, name: '' })} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={() => onCreate(modal.name)} disabled={!modal.name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Create Category
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Assign Users Modal ---
export function AssignUsersModal({
  modal, setModal, activeRole, usersData, usersLoading,
  userSearchQuery, setUserSearchQuery, assignUser
}: {
  modal: { open: boolean },
  setModal: React.Dispatch<React.SetStateAction<{ open: boolean }>>,
  activeRole: any,
  usersData: any,
  usersLoading: boolean,
  userSearchQuery: string,
  setUserSearchQuery: (query: string) => void,
  assignUser: (userId: number, roleId: number | null) => void
}) {
  if (!modal.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[600px] max-h-[90vh]">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Assign Users to {activeRole?.name}</h3>
            <p className="text-sm text-muted-foreground">Select users who should have this role.</p>
          </div>
          <button onClick={() => setModal({ open: false })} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
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
                      onClick={() => assignUser(user.id, isAssigned ? null : activeRole!.id)}
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
  )
}
