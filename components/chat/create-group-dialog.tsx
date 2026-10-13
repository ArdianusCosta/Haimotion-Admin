'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Check,
  Loader2,
  Sparkles,
  UserPlus,
  Briefcase,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { getActiveUsersForGroup, createChatGroup } from '@/app/actions/chat'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: (newGroup: any) => void
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setSelectedUserIds([])
      setSearchQuery('')
      setIsLoadingUsers(true)
      getActiveUsersForGroup()
        .then((data) => {
          setUsers(data)
        })
        .catch((err) => {
          console.error(err)
          toast.error('Gagal memuat daftar anggota')
        })
        .finally(() => {
          setIsLoadingUsers(false)
        })
    }
  }, [open])

  const toggleUser = (userId: number | string) => {
    const id = Number(userId)
    setSelectedUserIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    )
  }

  const removeUser = (userId: number | string) => {
    const id = Number(userId)
    setSelectedUserIds((prev) => prev.filter((i) => i !== id))
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q) ||
      (u.position && u.position.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    )
  })

  const selectedUsers = users.filter((u) => selectedUserIds.includes(Number(u.id)))

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map((u) => Number(u.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Silakan masukkan nama grup')
      return
    }

    if (selectedUserIds.length === 0) {
      toast.error('Pilih minimal 1 anggota untuk grup')
      return
    }

    try {
      setIsSubmitting(true)
      const numericIds = selectedUserIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
      const group = await createChatGroup(name, description, numericIds)
      toast.success(`Grup "${name}" berhasil dibuat!`)
      onGroupCreated(group)
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Gagal membuat grup')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAvatarBg = (id: number) => {
    const colors = [
      'bg-amber-600',
      'bg-orange-600',
      'bg-purple-600',
      'bg-emerald-600',
      'bg-blue-600',
      'bg-rose-600',
    ]
    return colors[id % colors.length]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-card border border-border shadow-2xl">
        <form onSubmit={handleSubmit} className="w-full flex flex-col min-w-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs shrink-0">
                  <Users className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Buat Obrolan Grup Baru
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Mulai percakapan tim terfokus untuk proyek atau departemen.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="p-6 space-y-4 max-h-[62vh] overflow-y-auto">
            {/* Group Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Nama Grup <span className="text-destructive">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {name.length}/50
                </span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="misal: Creative Studio, Dev Team, Marketing"
                className="h-10 text-xs bg-background/80 border-border focus-visible:ring-primary"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Deskripsi</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Opsional)</span>
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={120}
                placeholder="Tujuan atau topik percakapan grup ini..."
                className="h-10 text-xs bg-background/80 border-border focus-visible:ring-primary"
              />
            </div>

            {/* Member Selection Section */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserPlus className="size-3.5 text-primary" />
                  <span>Pilih Anggota</span>
                  <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0 h-4 bg-primary/10 text-primary">
                    {selectedUserIds.length} dipilih
                  </Badge>
                </label>

                {filteredUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors shrink-0 px-1"
                  >
                    {selectedUserIds.length === filteredUsers.length
                      ? 'Batalkan Semua'
                      : 'Pilih Semua'}
                  </button>
                )}
              </div>

              {/* Selected Users Chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/60 max-h-24 overflow-y-auto">
                  {selectedUsers.map((su) => (
                    <span
                      key={su.id}
                      className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-background border border-border text-xs text-foreground shadow-2xs group"
                    >
                      <span className={`flex size-4.5 items-center justify-center rounded-full text-[9px] font-bold text-white ${getAvatarBg(su.id)}`}>
                        {su.initials || su.name[0]}
                      </span>
                      <span className="text-[11px] font-medium max-w-[120px] truncate">
                        {su.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUser(su.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-muted"
                        title={`Hapus ${su.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {selectedUsers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds([])}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline px-1 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}

              {/* Search User Input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, atau jabatan..."
                  className="pl-8 pr-8 h-9 text-xs bg-background/80 border-border focus-visible:ring-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* User List */}
              <div className="rounded-xl border border-border bg-background/50 divide-y divide-border/50 max-h-56 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-xs">Memuat daftar anggota...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Tidak ada anggota ditemukan
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id)

                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center justify-between p-2.5 px-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/8 hover:bg-primary/12'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs ${getAvatarBg(
                              u.id
                            )}`}
                          >
                            {u.initials || u.name[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                              <Briefcase className="size-3 text-primary/70 shrink-0" />
                              <span className="truncate">{u.position || u.role}</span>
                            </p>
                          </div>
                        </div>

                        {/* Custom Checkbox */}
                        <div
                          className={`size-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground shadow-2xs'
                              : 'border-border bg-muted/40 hover:border-primary/50'
                          }`}
                        >
                          {isSelected && <Check className="size-3.5 stroke-[2.5]" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions (Zero margin clipping bug) */}
          <div className="p-4 px-6 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-muted-foreground font-medium">
              {selectedUserIds.length > 0
                ? `${selectedUserIds.length + 1} anggota (termasuk Anda)`
                : 'Pilih anggota grup'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="text-xs px-3.5"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !name.trim() || selectedUserIds.length === 0}
                className="text-xs gap-1.5 px-4 font-semibold shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Membuat...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Buat Grup</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
