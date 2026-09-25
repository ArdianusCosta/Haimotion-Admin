import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTaskComments, createTaskComment } from '@/app/actions/tasks'
import { toast } from 'sonner'
import { TaskComment } from '@/types/tasks'

export function useTaskComments(taskId: number, enabled: boolean) {
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: async () => {
      if (!taskId) return { comments: [] }
      const res = await getTaskComments(taskId)
      if (!res.success) throw new Error(res.error)
      return res
    },
    enabled: !!taskId && enabled,
    refetchInterval: 3000,
  })

  useEffect(() => {
    if (commentsData?.comments && enabled) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [commentsData?.comments, enabled])
  
  const postCommentMut = useMutation({
    mutationFn: async () => {
      if (!taskId || !newComment.trim()) return
      const res = await createTaskComment(taskId, newComment, replyToId || undefined)
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      setNewComment('')
      setReplyToId(null)
      refetchComments()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post comment')
    }
  })

  return {
    comments: (commentsData?.comments || []) as TaskComment[],
    newComment,
    setNewComment,
    replyToId,
    setReplyToId,
    mentionOpen,
    setMentionOpen,
    mentionSearch,
    setMentionSearch,
    commentsEndRef,
    postCommentMut
  }
}
