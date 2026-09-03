'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: number | null
  itemType: 'file' | 'folder'
  itemName: string
  userId: number | null
}

export function ShareDialog({ open, onOpenChange, itemId, itemType, itemName, userId }: ShareDialogProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch current shares
  const { data: sharesData, isLoading: sharesLoading } = useQuery({
    queryKey: ['shares', itemType, itemId],
    queryFn: async () => {
      const res = await fetch(`/api/file-manager/shares?itemId=${itemId}&itemType=${itemType}&userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch shares')
      return res.json()
    },
    enabled: !!itemId && !!userId && open,
  })

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['searchUsers', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { users: [] }
      const res = await fetch(`/api/file-manager/users/search?q=${encodeURIComponent(debouncedQuery)}&excludeId=${userId}`)
      if (!res.ok) throw new Error('Search failed')
      return res.json()
    },
    enabled: !!debouncedQuery && open,
  })

  // Add/Update share mutation
  const shareMutation = useMutation({
    mutationFn: async ({ sharedWithUserId, permission }: { sharedWithUserId: number, permission: string }) => {
      const res = await fetch('/api/file-manager/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType, sharedWithUserId, permission, userId })
      })
      if (!res.ok) throw new Error('Failed to share')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', itemType, itemId] })
      toast.success('Share updated successfully')
    },
    onError: (err: any) => toast.error(err.message)
  })

  // Remove share mutation
  const removeMutation = useMutation({
    mutationFn: async (sharedWithUserId: number) => {
      const res = await fetch(`/api/file-manager/shares?itemId=${itemId}&itemType=${itemType}&sharedWithUserId=${sharedWithUserId}&userId=${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to remove share')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', itemType, itemId] })
      toast.success('Access removed')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleShare = (targetUserId: number, permission: string) => {
    shareMutation.mutate({ sharedWithUserId: targetUserId, permission })
    setSearchQuery('')
  }

  const shares = sharesData?.shares || []
  const users = searchResults?.users || []

  // Filter out users that are already shared with
  const availableUsers = users.filter((u: any) => !shares.some((s: any) => s.shared_with_user.id === u.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{itemName}"</DialogTitle>
          <DialogDescription>
            Grant access to other users.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search people by name or email..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchLoading && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {debouncedQuery && !searchLoading && availableUsers.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border p-2 max-h-48 overflow-y-auto">
              <span className="text-xs font-semibold text-muted-foreground px-2">Suggestions</span>
              {availableUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar || ''} />
                      <AvatarFallback>{u.firstname?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{u.firstname} {u.lastname}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(val) => handleShare(u.id, val)} defaultValue="viewer">
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <h4 className="text-sm font-semibold">People with access</h4>
            {sharesLoading ? (
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : shares.length === 0 ? (
              <span className="text-sm text-muted-foreground">Not shared with anyone yet.</span>
            ) : (
              <div className="flex flex-col gap-3">
                {shares.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.shared_with_user.avatar || ''} />
                        <AvatarFallback>{s.shared_with_user.firstname?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{s.shared_with_user.firstname} {s.shared_with_user.lastname}</span>
                        <span className="text-xs text-muted-foreground">{s.shared_with_user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={s.permission} 
                        onValueChange={(val) => {
                          if (val === 'remove') {
                            removeMutation.mutate(s.shared_with_user.id)
                          } else {
                            shareMutation.mutate({ sharedWithUserId: s.shared_with_user.id, permission: val })
                          }
                        }}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs bg-transparent border-0 shadow-none hover:bg-accent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="remove" className="text-destructive focus:text-destructive">Remove access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
