import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Role } from '@/types/user'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'

export function useUsers(page: number, limit: number, debouncedSearch: string, roleFilter: string) {
  return useQuery({
    queryKey: ['users', page, debouncedSearch, roleFilter],
    queryFn: async () => {
      const res = await fetch(`/api/users?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}&role=${roleFilter}`)
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    }
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json()
    }
  })
}

export function useSaveUser(editingUserId?: number, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  return useMutation({
    mutationFn: async (payload: any) => {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users'
      const method = editingUserId ? 'PUT' : 'POST'
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
      if (onSuccess) onSuccess()
      toast.success(editingUserId ? t("User updated successfully!") : t("User created successfully!"))
    },
    onError: (error) => {
      toast.error(`${t('Failed to save user')}: ${error.message}`)
    }
  })
}

export function useDeleteUser(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (onSuccess) onSuccess()
      toast.success(t("User deleted successfully!"))
    },
    onError: (error) => {
      toast.error(`${t('Failed to delete user')}: ${error.message}`)
    }
  })
}

export function useUpdateUserStatus(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  return useMutation({
    mutationFn: async (user: User) => {
      const newStatus = user.status === 'resign' ? 'active' : 'resign'
      const res = await fetch(`/api/users/${user.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (onSuccess) onSuccess()
      toast.success(t("User status updated successfully!"))
    },
    onError: (error) => {
      toast.error(`${t('Failed to update status')}: ${error.message}`)
    }
  })
}
