import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await fetch('/api/permissions')
      if (!res.ok) throw new Error('Failed to fetch permissions')
      return res.json()
    }
  })
}

export function useAllUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/users?limit=1000')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    enabled
  })
}

export function useUpdateRolePerms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number, permissions: string[] }) => {
      const res = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })
      if (!res.ok) throw new Error('Failed to update permissions')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
  })
}

export function useCreatePerm(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create permission')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      if (onSuccessCallback) onSuccessCallback()
    }
  })
}

export function useUpdatePerm(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/permissions/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update permission')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      if (onSuccessCallback) onSuccessCallback()
    }
  })
}

export function useDeletePerm(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/permissions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete permission')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (onSuccessCallback) onSuccessCallback()
    }
  })
}

export function useCreateRole(onSuccessCallback?: (data: any) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create role')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (onSuccessCallback) onSuccessCallback(data)
    }
  })
}

export function useUpdateRole(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/roles/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (onSuccessCallback) onSuccessCallback()
    }
  })
}

export function useDeleteRole(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (onSuccessCallback) onSuccessCallback()
    },
    onError: (error) => {
      alert(error.message)
    }
  })
}

export function useAssignUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number, roleId: number | null }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId })
      })
      if (!res.ok) throw new Error('Failed to update user role')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
  })
}
