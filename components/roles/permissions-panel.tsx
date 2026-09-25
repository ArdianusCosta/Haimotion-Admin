'use client'

import React from 'react'
import { Edit2, Trash2, Users, Plus, CheckCircle2 } from 'lucide-react'

type PermissionsPanelProps = {
  activeRole: any
  categories: { name: string, permissions: any[] }[]
  isChecked: (permId: string) => boolean
  togglePermission: (permId: string) => void
  setRoleModal: React.Dispatch<React.SetStateAction<any>>
  setDeleteRoleConfirm: React.Dispatch<React.SetStateAction<any>>
  setAssignUsersModal: React.Dispatch<React.SetStateAction<any>>
  setAddCategoryModal: React.Dispatch<React.SetStateAction<any>>
  setPermModal: React.Dispatch<React.SetStateAction<any>>
  setDeleteModal: React.Dispatch<React.SetStateAction<any>>
}

export function PermissionsPanel({
  activeRole, categories, isChecked, togglePermission,
  setRoleModal, setDeleteRoleConfirm, setAssignUsersModal,
  setAddCategoryModal, setPermModal, setDeleteModal
}: PermissionsPanelProps) {
  if (!activeRole) return null

  return (
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
  )
}
