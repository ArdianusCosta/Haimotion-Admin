import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMeetings, createMeeting, updateMeetingStatus, getMeetingFormData } from '@/app/actions/meetings'
import { toast } from 'sonner'

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await getMeetings()
      if (!res.success) throw new Error(res.error)
      return res.data
    }
  })
}

export function useMeetingFormData() {
  return useQuery({
    queryKey: ['meetings', 'form-data'],
    queryFn: async () => {
      const res = await getMeetingFormData()
      if (!res.success) throw new Error(res.error)
      return res.data
    }
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await createMeeting(data)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting scheduled successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to schedule meeting: ' + error.message)
    }
  })
}

export function useUpdateMeetingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await updateMeetingStatus(id, status)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
    onError: (error: any) => {
      toast.error('Failed to update meeting status: ' + error.message)
    }
  })
}
