'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, UserPlus, X } from 'lucide-react'

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
  
  // Local state for members to manage UI optimistic updates
  const [currentMembers, setCurrentMembers] = useState<number[]>(
    project.user_ids ? project.user_ids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id)) : []
  )
  const [selectedNewUser, setSelectedNewUser] = useState<string>('')

  // Wait, actually I should import updateProject server action and just mutate the user_ids string
  const mutation = useMutation({
    mutationFn: async (newUserIds: string) => {
      const res = await updateProjectMembers(project.id, newUserIds)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', project.id] })
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
    mutation.mutate(newMembers.join(','))
    setSelectedNewUser('')
  }

  const handleRemoveMember = (userId: number) => {
    if (userId === project.manager_id) {
      toast.error('Cannot remove the Project Manager.')
      return
    }
    const newMembers = currentMembers.filter(id => id !== userId)
    setCurrentMembers(newMembers)
    mutation.mutate(newMembers.join(','))
  }

  const availableUsers = allUsers.filter(u => !currentMembers.includes(u.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Contributors</DialogTitle>
          <DialogDescription>
            Add or remove team members from this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-4">
          <Select value={selectedNewUser} onValueChange={setSelectedNewUser}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a user to add..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map(u => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstname} {u.lastname}
                </SelectItem>
              ))}
              {availableUsers.length === 0 && (
                <SelectItem value="none" disabled>No other users available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleAddMember} disabled={!selectedNewUser || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          </Button>
        </div>

        <ScrollArea className="max-h-[300px] w-full pr-4">
          <div className="flex flex-col gap-3">
            {currentMembers.map(userId => {
              const user = allUsers.find(u => u.id === userId)
              if (!user) return null
              const isManager = user.id === project.manager_id

              return (
                <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstname}`} />
                      <AvatarFallback>{user.firstname?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.firstname} {user.lastname}</p>
                      <p className="text-xs text-muted-foreground">{isManager ? 'Project Manager' : 'Member'}</p>
                    </div>
                  </div>
                  {!isManager && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveMember(user.id)}
                      disabled={mutation.isPending}
                    >
                      <X className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
