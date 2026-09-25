import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useFileManagerPrefs(userId: number | undefined) {
  return useQuery({
    queryKey: ['file-manager-pref', userId],
    queryFn: async () => {
      const res = await fetch(`/api/file-manager/preferences?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch pref')
      return res.json()
    },
    enabled: !!userId,
  })
}

export function useUpdatePrefs() {
  return useMutation({
    mutationFn: async ({ userId, file_manager_view_mode }: { userId: number, file_manager_view_mode: 'grid' | 'list' }) => {
      const res = await fetch('/api/file-manager/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, file_manager_view_mode })
      })
      if (!res.ok) throw new Error('Failed to update pref')
      return res.json()
    }
  })
}

export function useFolders(userId: number | undefined, currentFolderId: number | null, filter: string | null, query: string) {
  return useQuery({
    queryKey: ['file-manager-folders', userId, currentFolderId, filter],
    queryFn: async () => {
      let url = `/api/file-manager/folders?userId=${userId}`
      if (currentFolderId) url += `&parentId=${currentFolderId}`
      if (filter) url += `&filter=${filter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch folders')
      return res.json()
    },
    enabled: !!userId && (!filter || filter === 'shared') && !query,
  })
}

export function useFiles(userId: number | undefined, currentFolderId: number | null, query: string, filter: string | null) {
  return useQuery({
    queryKey: ['file-manager-files', userId, currentFolderId, query, filter],
    queryFn: async () => {
      let url = `/api/file-manager/files?userId=${userId}`
      if (query) url += `&search=${encodeURIComponent(query)}`
      else if (filter) url += `&filter=${filter}`
      else if (currentFolderId) url += `&folderId=${currentFolderId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch files')
      return res.json()
    },
    enabled: !!userId,
  })
}

export function useStats(userId: number | undefined) {
  return useQuery({
    queryKey: ['file-manager-stats', userId],
    queryFn: async () => {
      const res = await fetch(`/api/file-manager/stats?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: !!userId,
  })
}

export function useCreateFolder(userId: number | undefined, currentFolderId: number | null, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/file-manager/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolderId, userId })
      })
      if (!res.ok) throw new Error('Failed to create folder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-folders'] })
      if (onSuccess) onSuccess()
      toast.success('Folder created successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useUploadFiles(userId: number | undefined, currentFolderId: number | null, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData()
      formData.append('userId', String(userId))
      if (currentFolderId) formData.append('folderId', String(currentFolderId))
      Array.from(files).forEach(f => formData.append('files', f))
      
      const res = await fetch('/api/file-manager/files/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload files')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-files'] })
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] })
      if (onSuccess) onSuccess()
      toast.success('Files uploaded successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useDeleteFile(userId: number | undefined, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fileId: number) => {
      const res = await fetch(`/api/file-manager/files/${fileId}?userId=${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete file')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-files'] })
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] })
      if (onSuccess) onSuccess()
      toast.success('File deleted successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useUpdateFile(userId: number | undefined, onSuccess?: (action: string) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action, payload }: { id: number, action: string, payload: any }) => {
      const res = await fetch(`/api/file-manager/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...payload })
      })
      if (!res.ok) throw new Error(`Failed to ${action} file`)
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-files'] })
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] })
      if (onSuccess) onSuccess(variables.action)
      toast.success(`File ${variables.action === 'star' ? 'star status updated' : variables.action + 'd'} successfully`)
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useDeleteFolder(userId: number | undefined, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (folderId: number) => {
      const res = await fetch(`/api/file-manager/folders/${folderId}?userId=${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete folder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-folders'] })
      if (onSuccess) onSuccess()
      toast.success('Folder deleted successfully')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useUpdateFolder(userId: number | undefined, onSuccess?: (action: string) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action, payload }: { id: number, action: string, payload: any }) => {
      const res = await fetch(`/api/file-manager/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...payload })
      })
      if (!res.ok) throw new Error(`Failed to ${action} folder`)
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['file-manager-folders'] })
      if (onSuccess) onSuccess(variables.action)
      toast.success(`Folder ${variables.action + 'd'} successfully`)
    },
    onError: (err: Error) => toast.error(err.message)
  })
}
