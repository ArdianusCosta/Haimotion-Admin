import fs from 'fs'

const filePath = './components/calendar-page.tsx'
let code = fs.readFileSync(filePath, 'utf8')

// 1. Add imports
code = code.replace(
  "import { useState, useEffect } from 'react'",
  "import { useState } from 'react'\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'"
)

// 2. Remove states and fetchEvents
code = code.replace(/const \[events, setEvents\] = useState<any\[\]>\(\[\]\)\n  const \[loading, setLoading\] = useState\(true\)/, '')
code = code.replace(/useEffect\(\(\) => {\n    fetchEvents\(\)\n  }, \[\]\)/, '')
code = code.replace(/const fetchEvents = async \(\) => {[\s\S]*?setLoading\(false\)\n  }/, '')

// 3. Add useQuery Client and Query
const queryCode = `
  const queryClient = useQueryClient()
  
  const { data: eventsRes, isLoading: loading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => getEvents()
  })
  
  const events = eventsRes?.success && eventsRes.data ? eventsRes.data : []
`
code = code.replace(/const \[view, setView\] = useState<'Month' | 'Week' | 'Day'>\('Month'\)/, `const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Month')\n${queryCode}`)

// 4. Update Save Mutation
const saveMutation = `
  const saveEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      let res;
      if (selectedEventId) {
        res = await updateEvent(selectedEventId, payload)
      } else {
        res = await createEvent(payload)
      }
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success(selectedEventId ? 'Event updated successfully' : 'Event created successfully')
      setIsDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save event')
  })

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const start = \`\${formData.start_date}T\${formData.start_time}:00\`
      const end = \`\${formData.end_date}T\${formData.end_time}:00\`
      
      saveEventMutation.mutate({
        title: formData.title,
        start_event: start,
        end_event: end,
        color: formData.color,
        description: formData.description
      }, {
        onSettled: () => setIsSubmitting(false)
      })
    } catch (error: any) {
      toast.error('Invalid date format')
      setIsSubmitting(false)
    }
  }
`
code = code.replace(/const handleSaveEvent = async \(e: React.FormEvent\) => {[\s\S]*?finally {\n      setIsSubmitting\(false\)\n    }\n  }/, saveMutation)

// 5. Update Delete Mutation
const deleteMut = `
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await deleteEvent(id)
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('Event deleted successfully')
      setIsDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete event')
  })

  const handleDeleteEvent = () => {
    if (!selectedEventId) return
    if (!confirm('Are you sure you want to delete this event?')) return
    
    setIsSubmitting(true)
    deleteEventMutation.mutate(selectedEventId, {
      onSettled: () => setIsSubmitting(false)
    })
  }
`
code = code.replace(/const handleDeleteEvent = async \(\) => {[\s\S]*?finally {\n      setIsSubmitting\(false\)\n    }\n  }/, deleteMut)

// 6. Update Drag Drop Mutation
const dropMut = `
  const moveEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await updateEvent(payload.id, payload.data)
      if (!res.success) throw new Error(res.error)
      return res
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] })
      const prev = queryClient.getQueryData(['calendarEvents'])
      
      queryClient.setQueryData(['calendarEvents'], (old: any) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.map((ev: any) => 
            ev.id === payload.id 
              ? { ...ev, start_event: payload.data.start_event, end_event: payload.data.end_event } 
              : ev
          )
        }
      })
      
      return { prev }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['calendarEvents'], context?.prev)
      toast.error('Failed to move event')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    }
  })

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    const eventIdStr = e.dataTransfer.getData('eventId')
    if (!eventIdStr) return
    const eventId = parseInt(eventIdStr)
    
    const eventToMove = events.find((ev: any) => ev.id === eventId)
    if (!eventToMove) return

    const oldStart = new Date(eventToMove.start_event)
    const oldEnd = new Date(eventToMove.end_event)
    
    const [year, month, day] = dateStr.split('-').map(Number)
    const newStart = new Date(year, month - 1, day, oldStart.getHours(), oldStart.getMinutes(), 0)
    
    const durationMs = oldEnd.getTime() - oldStart.getTime()
    const newEnd = new Date(newStart.getTime() + durationMs)

    const formatToLocalISO = (d: Date) => {
      return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}T\${String(d.getHours()).padStart(2, '0')}:\${String(d.getMinutes()).padStart(2, '0')}:00\`
    }
    
    moveEventMutation.mutate({
      id: eventId,
      data: {
        title: eventToMove.title,
        color: eventToMove.color,
        description: eventToMove.description,
        start_event: formatToLocalISO(newStart),
        end_event: formatToLocalISO(newEnd)
      }
    })
  }
`
code = code.replace(/const handleDrop = async \(e: React.DragEvent, dateStr: string\) => {[\s\S]*?fetchEvents\(\) \/\/ revert on fail\n    }\n  }/, dropMut)


fs.writeFileSync(filePath, code)
