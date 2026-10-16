'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  Search,
  Check,
  Loader2,
  UserPlus,
  Pencil,
  Save,
  X,
  Crown,
  UserMinus,
  Briefcase,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateChatGroup,
  addGroupMembers,
  removeGroupMember,
  getActiveUsersForGroup,
} from '@/app/actions/chat'

interface Member {
  id: number
  name: string
  avatar?: string | null
  isAdmin: boolean
  role?: string
}

interface GroupSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: number
  groupName: string
  groupDescription?: string | null
  groupAvatar?: string | null
  members: Member[]
  currentUserId: number
  isCurrentUserAdmin: boolean
  onGroupUpdated: (updates: { name?: string; description?: string; avatar?: string | null; members?: Member[] }) => void
}

export function GroupSettingsSheet({
  open,
  onOpenChange,
  groupId,
  groupName,
  groupDescription,
  groupAvatar,
  members,
  currentUserId,
  isCurrentUserAdmin,
  onGroupUpdated,
}: GroupSettingsSheetProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(groupName)
  const [editDesc, setEditDesc] = useState(groupDescription || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Avatar upload
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(groupAvatar || null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isAdding, setIsAdding] = useState(false)

  const [kickingId, setKickingId] = useState<number | null>(null)

  // State untuk popup konfirmasi kick
  const [kickConfirm, setKickConfirm] = useState<{ id: number; name: string; avatar?: string | null } | null>(null)

  useEffect(() => {
    setEditName(groupName)
    setEditDesc(groupDescription || '')
    setCurrentAvatar(groupAvatar || null)
  }, [groupName, groupDescription, groupAvatar])

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const data = await getActiveUsersForGroup()
      setAllUsers(data)
    } catch {
      toast.error('Gagal memuat daftar pengguna')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (showAddPanel) {
      setSelectedIds([])
      setSearchQuery('')
      loadUsers()
    }
  }, [showAddPanel, loadUsers])

  useEffect(() => {
    if (!open) {
      setIsEditingProfile(false)
      setShowAddPanel(false)
      setSelectedIds([])
      setSearchQuery('')
    }
  }, [open])

  const memberIds = new Set(members.map((m) => m.id))

  const filteredUsers = allUsers.filter((u) => {
    if (memberIds.has(u.id)) return false
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q))
    )
  })

  const getAvatarBg = (id: number) => {
    const colors = [
      'bg-amber-600', 'bg-orange-600', 'bg-purple-600',
      'bg-emerald-600', 'bg-blue-600', 'bg-rose-600',
    ]
    return colors[id % colors.length]
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Nama grup tidak boleh kosong')
      return
    }
    try {
      setIsSavingProfile(true)
      await updateChatGroup(groupId, editName.trim(), editDesc.trim() || undefined)
      toast.success('Profil grup berhasil diperbarui')
      onGroupUpdated({ name: editName.trim(), description: editDesc.trim() || undefined })
      setIsEditingProfile(false)
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui profil grup')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAddMembers = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsAdding(true)
      const newMembers = await addGroupMembers(groupId, selectedIds)
      toast.success(`${selectedIds.length} anggota berhasil ditambahkan`)
      onGroupUpdated({ members: newMembers })
      setShowAddPanel(false)
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan anggota')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB')
      return
    }
    try {
      setIsUploadingAvatar(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload gagal')
      const { url } = await res.json()
      // Save to DB immediately
      await updateChatGroup(groupId, editName || groupName, editDesc || groupDescription || undefined, url)
      setCurrentAvatar(url)
      onGroupUpdated({ avatar: url })
      toast.success('Foto grup berhasil diperbarui')
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload foto')
    } finally {
      setIsUploadingAvatar(false)
      // reset input
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleKickConfirm = async () => {
    if (!kickConfirm) return
    const { id, name } = kickConfirm
    try {
      setKickingId(id)
      setKickConfirm(null)
      const newMembers = await removeGroupMember(groupId, id)
      toast.success(`${name} telah dikeluarkan dari grup`)
      onGroupUpdated({ members: newMembers })
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengeluarkan anggota')
    } finally {
      setKickingId(null)
    }
  }

  return (
    <>
    {/* Popup Konfirmasi Keluarkan Anggota */}
    <Dialog
      open={kickConfirm !== null}
      onOpenChange={(o) => { if (!o) setKickConfirm(null) }}
    >
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 shrink-0">
              <ShieldAlert className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Keluarkan Anggota
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tindakan ini tidak dapat dibatalkan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {kickConfirm && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 my-1">
            {kickConfirm.avatar ? (
              <img
                src={kickConfirm.avatar}
                alt={kickConfirm.name}
                className="size-9 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarBg(kickConfirm.id)}`}
              >
                {kickConfirm.name[0]}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{kickConfirm.name}</p>
              <p className="text-xs text-muted-foreground">Akan dikeluarkan dari grup ini</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">
          Apakah kamu yakin ingin mengeluarkan{' '}
          <span className="font-semibold text-foreground">{kickConfirm?.name}</span>{' '}
          dari grup ini? Mereka tidak akan bisa melihat percakapan grup setelah dikeluarkan.
        </p>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9"
            onClick={() => setKickConfirm(null)}
            disabled={kickingId === kickConfirm?.id}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 text-xs h-9 gap-1.5 font-semibold"
            onClick={handleKickConfirm}
            disabled={kickingId === kickConfirm?.id}
          >
            {kickingId === kickConfirm?.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <UserMinus className="size-3.5" />
            )}
            Ya, Keluarkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 overflow-y-auto overflow-x-hidden border-l border-border bg-card shadow-2xl flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Pengaturan Grup</SheetTitle>
        </SheetHeader>

        {/* Banner */}
        <div className="relative shrink-0">
          <div className="h-28 w-full bg-gradient-to-r from-primary/20 via-purple-500/15 to-amber-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-9 left-6">
            {/* Hidden file input */}
            {isCurrentUserAdmin && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            )}
            <div
              className={`relative flex size-[72px] items-center justify-center rounded-2xl border-4 border-card shadow-lg ring-1 ring-border overflow-hidden ${
                isCurrentUserAdmin ? 'cursor-pointer group/avatar' : ''
              } ${currentAvatar ? 'bg-transparent' : 'bg-primary'}`}
              onClick={() => isCurrentUserAdmin && !isUploadingAvatar && avatarInputRef.current?.click()}
              title={isCurrentUserAdmin ? 'Klik untuk ganti foto grup' : undefined}
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-8 animate-spin text-primary-foreground" />
              ) : currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={groupName}
                  className="size-full object-cover"
                />
              ) : (
                <Users className="size-8 text-primary-foreground" />
              )}
              {isCurrentUserAdmin && !isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-[10px]">
                  <Camera className="size-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="pt-12 px-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight text-foreground truncate">
                {groupName}
              </h2>
              {groupDescription && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {groupDescription}
                </p>
              )}
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 text-[11px] font-semibold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20"
            >
              {members.length} anggota
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Edit Profile */}
        {isCurrentUserAdmin && (
          <>
            <div className="px-6 py-4 space-y-3">
              <button
                onClick={() => setIsEditingProfile((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Pencil className="size-3.5 text-primary" />
                  Edit Profil Grup
                </span>
                {isEditingProfile ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              {isEditingProfile && (
                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Nama Grup <span className="text-destructive">*</span></span>
                      <span className="text-[10px] text-muted-foreground font-normal">{editName.length}/50</span>
                    </label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                      placeholder="Nama grup..."
                      className="h-9 text-xs bg-background/80 border-border focus-visible:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Deskripsi</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Opsional)</span>
                    </label>
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={120}
                      placeholder="Tujuan grup ini..."
                      className="h-9 text-xs bg-background/80 border-border focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => {
                        setEditName(groupName)
                        setEditDesc(groupDescription || '')
                        setIsEditingProfile(false)
                      }}
                      disabled={isSavingProfile}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-8 gap-1.5 font-semibold"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile || !editName.trim()}
                    >
                      {isSavingProfile ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      Simpan
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Members */}
        <div className="px-6 py-4 space-y-3 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="size-3.5 text-primary" />
              Anggota Grup
            </span>
            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowAddPanel((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <UserPlus className="size-3.5" />
                {showAddPanel ? 'Tutup' : 'Tambah'}
              </button>
            )}
          </div>

          {/* Add panel */}
          {showAddPanel && isCurrentUserAdmin && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[11px] font-medium text-primary">Tambah anggota baru:</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau jabatan..."
                  className="pl-8 h-8 text-xs bg-background border-border focus-visible:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="rounded-lg border border-border bg-background/50 divide-y divide-border/50 max-h-48 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs">Memuat...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {searchQuery ? 'Tidak ada pengguna ditemukan' : 'Semua pengguna aktif sudah menjadi anggota'}
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedIds.includes(u.id)
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleSelect(u.id)}
                        className={`flex items-center justify-between p-2 px-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/8 hover:bg-primary/12' : 'hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${getAvatarBg(u.id)}`}>
                            {u.initials || u.name[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Briefcase className="size-2.5 text-primary/70 shrink-0" />
                              {u.position || u.role}
                            </p>
                          </div>
                        </div>
                        <div className={`size-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-muted/40'
                        }`}>
                          {isSelected && <Check className="size-2.5 stroke-[2.5]" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <Button
                size="sm"
                className="w-full text-xs h-8 gap-1.5 font-semibold"
                onClick={handleAddMembers}
                disabled={isAdding || selectedIds.length === 0}
              >
                {isAdding ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UserPlus className="size-3.5" />
                )}
                {selectedIds.length > 0 ? `Tambahkan ${selectedIds.length} Anggota` : 'Pilih anggota'}
              </Button>
            </div>
          )}

          {/* Member rows */}
          <div className="space-y-0.5 overflow-y-auto flex-1">
            {members.map((member) => {
              const isMe = member.id === currentUserId
              const isBeingKicked = kickingId === member.id
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="size-8 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${getAvatarBg(member.id)}`}>
                        {member.name[0]}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {member.name}
                          {isMe && (
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">(Anda)</span>
                          )}
                        </p>
                        {member.isAdmin && (
                          <Crown className="size-3 text-amber-500 shrink-0" title="Admin" />
                        )}
                      </div>
                      {member.role && (
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Briefcase className="size-2.5 text-primary/70 shrink-0" />
                          {member.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {isCurrentUserAdmin && !isMe && (
                    <button
                      onClick={() => setKickConfirm({ id: member.id, name: member.name, avatar: member.avatar })}
                      disabled={isBeingKicked}
                      title={`Keluarkan ${member.name}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      {isBeingKicked ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {!isCurrentUserAdmin && (
          <div className="px-6 pb-5 shrink-0">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Hanya admin grup yang dapat mengedit profil atau mengelola anggota.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  )
}
