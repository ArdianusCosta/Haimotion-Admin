import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/app/actions/events'
import { toast } from 'sonner'

export function useCalendar() {
  const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Month') 
  const queryClient = useQueryClient()
  
  const { data: eventsRes, isLoading: loading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => getEvents()
  })
  
  const events = eventsRes?.success && eventsRes.data ? eventsRes.data : []
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '10:00',
    color: 'bg-primary text-primary-foreground',
    description: ''
  })

  const handlePrevious = () => {
    const d = new Date(currentDate)
    if (view === 'Month') d.setMonth(d.getMonth() - 1)
    if (view === 'Week') d.setDate(d.getDate() - 7)
    if (view === 'Day') d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (view === 'Month') d.setMonth(d.getMonth() + 1)
    if (view === 'Week') d.setDate(d.getDate() + 7)
    if (view === 'Day') d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const openEventDialog = (event?: any, dateStr?: string) => {
    if (event) {
      const start = new Date(event.start_event)
      const end = new Date(event.end_event)
      setFormData({
        title: event.title,
        start_date: `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
        start_time: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        end_date: `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
        end_time: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        color: event.color || 'bg-primary text-primary-foreground',
        description: event.description || ''
      })
      setSelectedEventId(event.id)
    } else if (dateStr) {
      setFormData({
        title: '',
        start_date: dateStr,
        start_time: '09:00',
        end_date: dateStr,
        end_time: '10:00',
        color: 'bg-primary text-primary-foreground',
        description: ''
      })
      setSelectedEventId(null)
    } else {
      setFormData({
        title: '',
        start_date: '',
        start_time: '09:00',
        end_date: '',
        end_time: '10:00',
        color: 'bg-primary text-primary-foreground',
        description: ''
      })
      setSelectedEventId(null)
    }
    setIsDialogOpen(true)
  }

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
      const start = `${formData.start_date}T${formData.start_time}:00`
      const end = `${formData.end_date}T${formData.end_time}:00`
      
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
    setIsSubmitting(true)
    deleteEventMutation.mutate(selectedEventId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setIsDialogOpen(false)
      },
      onSettled: () => setIsSubmitting(false)
    })
  }

  const exportAllEvents = () => {
    if (events.length === 0) {
      toast.error('No events to export')
      return
    }
    
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HaiMotion//Admin//EN\n"
    
    events.forEach((event: any) => {
      const start = new Date(event.start_event).toISOString().replace(/-|:|\.\d\d\d/g, '')
      const end = new Date(event.end_event).toISOString().replace(/-|:|\.\d\d\d/g, '')
      
      icsContent += "BEGIN:VEVENT\n"
      icsContent += `UID:${event.id}@haimotion\n`
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}\n`
      icsContent += `DTSTART:${start}\n`
      icsContent += `DTEND:${end}\n`
      icsContent += `SUMMARY:${event.title}\n`
      if (event.description) icsContent += `DESCRIPTION:${event.description}\n`
      icsContent += "END:VEVENT\n"
    })
    
    icsContent += "END:VCALENDAR"
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'haimotion-events.ics'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Calendar exported successfully!')
  }

  const handleDragStart = (e: React.DragEvent, eventId: number) => {
    e.dataTransfer.setData('eventId', eventId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() 
  }

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
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`
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

  const getGoogleCalendarUrl = () => {
    try {
      const start = new Date(`${formData.start_date}T${formData.start_time}:00`).toISOString().replace(/-|:|\.\d\d\d/g, '')
      const end = new Date(`${formData.end_date}T${formData.end_time}:00`).toISOString().replace(/-|:|\.\d\d\d/g, '')
      
      const url = new URL('https://calendar.google.com/calendar/render')
      url.searchParams.append('action', 'TEMPLATE')
      url.searchParams.append('text', formData.title || 'New Event')
      url.searchParams.append('dates', `${start}/${end}`)
      if (formData.description) url.searchParams.append('details', formData.description)
      
      return url.toString()
    } catch (e) {
      return '#'
    }
  }

  return {
    view,
    setView,
    events,
    loading,
    currentDate,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isSubmitting,
    selectedEventId,
    formData,
    setFormData,
    handlePrevious,
    handleNext,
    handleToday,
    openEventDialog,
    handleSaveEvent,
    handleDeleteEvent,
    exportAllEvents,
    handleDragStart,
    handleDragOver,
    handleDrop,
    getGoogleCalendarUrl
  }
}
