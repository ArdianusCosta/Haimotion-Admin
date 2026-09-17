'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, UserPlus, X, Crown } from 'lucide-react'

import { updateProjectMembers } from '@/app/actions/projects'

export function ProjectContributorsDialog({ 
  open, 
  onOpenChange, 
  project, 
  allUsers 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  project: any
  allUsers: any[] 
}) {
  const queryClient = useQueryClient()
  
  const [currentMembers, setCurrentMembers] = useState<number[]>([])
  const [selectedNewUser, setSelectedNewUser] = useState<string>('')

  // Sync members whenever dialog opens or project changes
  useEffect(() => {
    if (open && project) {
      const memberIds: number[] = project.members
        ? project.members.map((m: any) => Number(m.id))
        : []
      // Always include manager
      const allIds = Array.from(new Set([Number(project.manager_id), ...memberIds]))
      setCurrentMembers(allIds)
      setSelectedNewUser('')
    }
  }, [open, project])

  const mutation = useMutation({
    mutationFn: async (newUserIds: number[]) => {
      const res = await updateProjectMembers(project.id, newUserIds)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Contributors updated successfully.')
    },
    onError: () => {
      toast.error('Failed to update contributors.')
    }
  })

  const handleAddMember = () => {
    if (!selectedNewUser) return
    const userId = parseInt(selectedNewUser)
    if (currentMembers.includes(userId)) {
      toast.error('User is already a member.')
      return
    }
    const newMembers = [...currentMembers, userId]
    setCurrentMembers(newMembers)
    mutation.mutate(newMembers)
    setSelectedNewUser('')
  }

  const handleRemoveMember = (userId: number) => {
    if (userId === Number(project.manager_id)) {
      toast.error('Cannot remove the Project Manager.')
      return
    }
    const newMembers = currentMembers.filter(id => id !== userId)
    setCurrentMembers(newMembers)
    mutation.mutate(newMembers)
  }

  const availableUsers = allUsers.filter(u => !currentMembers.includes(Number(u.id)))

  const getMemberUser = (userId: number) => allUsers.find(u => Number(u.id) === userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header — same style as Preferences panel */}
        <div className="mb-2">
          <h2 className="text-xl font-semibold tracking-tight">Manage Contributors</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Add or remove team members from this project.</p>
        </div>

        {/* Add member row */}
        <div className="flex items-center gap-2 py-3">
          <select
            value={selectedNewUser}
            onChange={e => setSelectedNewUser(e.target.value)}
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="">-- Select a user to add --</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id.toString()}>
                {u.firstname} {u.lastname}
              </option>
            ))}
          </select>
          <Button
            onClick={handleAddMember}
            disabled={!selectedNewUser || mutation.isPending}
            size="icon"
          >
            {mutation.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <UserPlus className="size-4" />
            }
          </Button>
        </div>

        {/* Current members grid */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Current Contributors ({currentMembers.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
              {currentMembers.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No contributors yet.
                </p>
              )}
              {currentMembers.map(userId => {
                const user = getMemberUser(userId)
                if (!user) return null
                const isManager = Number(user.id) === Number(project.manager_id)

                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {user.firstname?.[0]}{user.lastname?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.firstname} {user.lastname}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          {isManager && <Crown className="size-3 text-amber-500" />}
                          {isManager ? 'Project Manager' : 'Member'}
                        </p>
                      </div>
                    </div>
                    {!isManager && (
                      <button
                        onClick={() => handleRemoveMember(Number(user.id))}
                        disabled={mutation.isPending}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        title="Remove member"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
