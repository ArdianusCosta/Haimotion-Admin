import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMeetings, getMeetingByCode, createMeeting, updateMeeting,
  cancelMeeting, deleteMeeting, updateMeetingStatus, getMeetingFormData,
  admitParticipant, rejectParticipant
} from '@/app/actions/meetings'
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

export function useMeeting(meetingCode: string | null) {
  return useQuery({
    queryKey: ['meeting', meetingCode],
    queryFn: async () => {
      if (!meetingCode) return null
      const res = await getMeetingByCode(meetingCode)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    enabled: !!meetingCode,
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

export function useUpdateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await updateMeeting(id, data)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update meeting: ' + error.message)
    }
  })
}

export function useCancelMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await cancelMeeting(id)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting cancelled')
    },
    onError: (error: any) => {
      toast.error('Failed to cancel meeting: ' + error.message)
    }
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteMeeting(id)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting deleted')
    },
    onError: (error: any) => {
      toast.error('Failed to delete meeting: ' + error.message)
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

export function useMeetingParticipants(meetingCode: string | null, isHost: boolean) {
  return useQuery({
    queryKey: ['meeting-participants', meetingCode],
    queryFn: async () => {
      if (!meetingCode) return []
      const res = await fetch(`/api/meetings/${meetingCode}/participants`)
      if (!res.ok) throw new Error('Failed to fetch participants')
      const data = await res.json()
      return data.participants || []
    },
    enabled: !!meetingCode && isHost,
    refetchInterval: 3000, // Poll every 3s for waiting room
  })
}

export function useAdmitParticipant(meetingCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (participantId: number) => {
      const res = await admitParticipant(participantId)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-participants', meetingCode] })
      toast.success('Participant admitted')
    },
    onError: (error: any) => {
      toast.error('Failed to admit participant: ' + error.message)
    }
  })
}

export function useRejectParticipant(meetingCode: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (participantId: number) => {
      const res = await rejectParticipant(participantId)
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-participants', meetingCode] })
      toast.success('Participant removed')
    },
    onError: (error: any) => {
      toast.error('Failed to reject participant: ' + error.message)
    }
  })
}
