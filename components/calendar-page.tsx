'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, MoreHorizontal, Calendar as CalendarIcon, Loader2, Trash2, Download } from 'lucide-react'
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/app/actions/events'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function CalendarPage() {
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
      // Edit mode
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
      // Pre-fill date
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
      // Create mode fresh
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
    
    events.forEach(event => {
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
    e.preventDefault() // Required to allow dropping
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

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  const today = new Date()
  
  // Generating a simple grid for the month
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth
    const dateObj = new Date(year, month, dayNumber)
    const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
    
    const dayEvents = isCurrentMonth ? events.filter(e => {
      const eDate = new Date(e.start_event)
      return eDate.getDate() === dayNumber && eDate.getMonth() === month && eDate.getFullYear() === year
    }) : []
    
    return {
      id: i,
      number: isCurrentMonth ? dayNumber : (dayNumber <= 0 ? new Date(year, month, 0).getDate() + dayNumber : dayNumber - daysInMonth),
      isCurrentMonth,
      isToday,
      events: dayEvents,
      dateStr: isCurrentMonth ? `${year}-${String(month+1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}` : null
    }
  }).filter((_, i, arr) => {
    // Only show 5 rows if 35 days is enough, otherwise 6 rows (42)
    if (i >= 35 && !arr[35].isCurrentMonth) return false
    return true
  })

  // Generating display grid based on current view
  let displayDays: any[] = []
  
  if (view === 'Month') {
    displayDays = calendarDays
  } else if (view === 'Week') {
    const currentDay = currentDate.getDay() // 0-6
    const startDate = new Date(currentDate)
    startDate.setDate(startDate.getDate() - currentDay)
    
    displayDays = Array.from({ length: 7 }, (_, i) => {
      const dateObj = new Date(startDate)
      dateObj.setDate(startDate.getDate() + i)
      const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
      
      const dayEvents = events.filter(e => {
        const eDate = new Date(e.start_event)
        return eDate.getDate() === dateObj.getDate() && eDate.getMonth() === dateObj.getMonth() && eDate.getFullYear() === dateObj.getFullYear()
      })
      
      return {
        id: i,
        number: dateObj.getDate(),
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
        dateStr: `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
      }
    })
  } else if (view === 'Day') {
    const dateObj = new Date(currentDate)
    const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
    
    const dayEvents = events.filter(e => {
      const eDate = new Date(e.start_event)
      return eDate.getDate() === dateObj.getDate() && eDate.getMonth() === dateObj.getMonth() && eDate.getFullYear() === dateObj.getFullYear()
    })
    
    displayDays = [{
      id: 0,
      number: dateObj.getDate(),
      isCurrentMonth: true,
      isToday,
      events: dayEvents,
      dateStr: `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
    }]
  }

  // Format header title based on view
  let headerTitle = `${monthName} ${year}`
  if (view === 'Week') {
    const currentDay = currentDate.getDay()
    const startDate = new Date(currentDate)
    startDate.setDate(startDate.getDate() - currentDay)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    headerTitle = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}, ${endDate.getFullYear()}`
  } else if (view === 'Day') {
    headerTitle = currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Format time for display (e.g. 09:00 AM)
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Apps</span><span>/</span><span className="text-foreground">Calendar</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage your meetings, events, and important deadlines.</p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            {['Month', 'Week', 'Day'].map((v) => (
              <button 
                key={v}
                onClick={() => setView(v as any)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {v}
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            onClick={exportAllEvents}
            className="flex items-center gap-2"
          >
            <Download className="size-4" /> Export All
          </Button>

          <button 
            onClick={() => openEventDialog()} 
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> New event
          </button>
          
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this event? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteEvent} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSaveEvent}>
                <DialogHeader>
                  <DialogTitle>{selectedEventId ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="E.g., Team Sync" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input id="start_date" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input id="start_time" type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input id="end_time" type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} required />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="color">Color Theme</Label>
                    <select 
                      id="color" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.color} 
                      onChange={e => setFormData({...formData, color: e.target.value})}
                    >
                      <option value="bg-primary text-primary-foreground">Primary (Default)</option>
                      <option value="bg-blue-500/20 text-blue-700 dark:text-blue-400">Blue</option>
                      <option value="bg-green-500/20 text-green-700 dark:text-green-400">Green</option>
                      <option value="bg-amber-500/20 text-amber-700 dark:text-amber-400">Yellow</option>
                      <option value="bg-red-500/20 text-red-700 dark:text-red-400">Red</option>
                      <option value="bg-slate-500/20 text-slate-700 dark:text-slate-400">Gray</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional details..." />
                  </div>
                </div>
                <DialogFooter className="flex flex-row justify-between w-full items-center">
                  <div className="flex gap-2">
                    {selectedEventId && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSubmitting} title="Delete Event">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    {selectedEventId && (
                      <a 
                        href={getGoogleCalendarUrl()} 
                        target="_blank" 
                        rel="noreferrer"
                        title="Export to Google Calendar"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted hover:text-foreground transition-all outline-none"
                      >
                        <CalendarIcon className="size-4 text-blue-500" />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {selectedEventId ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        {/* Sidebar / Mini Calendar & Upcoming */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-72">
          {/* Mini Calendar (Mocked visual representation) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{monthName} {year}</h2>
              <div className="flex gap-1">
                <button onClick={handlePrevious} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" /></button>
                <button onClick={handleNext} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-4" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="py-1">{d}</div>)}
              {calendarDays.slice(0, 35).map((day, i) => (
                <div 
                  key={i} 
                  className={`flex aspect-square items-center justify-center rounded-full text-xs 
                    ${!day.isCurrentMonth ? 'text-muted-foreground/30' : ''}
                    ${day.isToday ? 'bg-primary font-bold text-primary-foreground' : 'hover:bg-muted'}
                  `}
                >
                  {day.number}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Recent & Upcoming events</h2>
            <div className="mt-5 flex flex-col gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="flex flex-col items-center min-w-[36px] gap-1 pt-1">
                      <div className="h-3 w-8 bg-muted rounded" />
                      <div className="h-5 w-6 bg-muted rounded" />
                      <div className="h-2 w-8 bg-muted rounded" />
                    </div>
                    <div className="flex-1 rounded-xl border border-border p-3 flex flex-col gap-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : events.length > 0 ? (
                // Sort by date (closest to today first)
                [...events].sort((a, b) => {
                  const now = new Date().getTime()
                  return Math.abs(new Date(a.start_event).getTime() - now) - Math.abs(new Date(b.start_event).getTime() - now)
                }).slice(0, 4).map((event) => {
                  const eventDate = new Date(event.start_event)
                  const monthShort = eventDate.toLocaleString('default', { month: 'short' })
                  return (
                    <div 
                      key={event.id} 
                      className="group flex gap-3 cursor-pointer"
                      onClick={() => openEventDialog(event)}
                    >
                      <div className="flex flex-col items-center min-w-[36px]">
                        <span className="text-xs font-semibold text-muted-foreground">{monthShort}</span>
                        <span className={`text-lg font-bold ${eventDate.toDateString() === today.toDateString() ? 'text-primary' : 'text-foreground'}`}>{eventDate.getDate()}</span>
                        <span className="text-[10px] text-muted-foreground">{eventDate.getFullYear()}</span>
                      </div>
                      <div className="flex-1 rounded-xl border border-border bg-background p-3 transition-colors group-hover:border-primary/30 group-hover:bg-muted/30 overflow-hidden">
                        <h3 className="text-sm font-medium truncate" title={event.title}>{event.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" /> <span className="truncate">{formatTime(event.start_event)}</span>
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No events found</p>
              )}
            </div>
            <Dialog>
              <DialogTrigger className="mt-5 w-full rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted">
                View all events
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>All Events</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">No events found.</p>
                  ) : (
                    [...events].sort((a, b) => new Date(b.start_event).getTime() - new Date(a.start_event).getTime()).map(event => (
                      <div 
                        key={event.id} 
                        className="flex flex-col gap-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => openEventDialog(event)}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${event.color || 'bg-primary text-primary-foreground'}`}>
                            {new Date(event.start_event).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="size-3" /> {formatTime(event.start_event)} - {formatTime(event.end_event)}
                        </p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-2">{event.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-xl font-semibold">{headerTitle}</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleToday} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Today</button>
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                <button onClick={handlePrevious} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" /></button>
                <button onClick={handleNext} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-4" /></button>
              </div>
            </div>
          </div>
          
          <div className={`grid border-b border-border bg-muted/30 ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter((_, i) => view === 'Day' ? i === currentDate.getDay() : true).map((day) => (
              <div key={day} className="border-r border-border py-3 text-center text-xs font-medium text-muted-foreground last:border-0">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.substring(0, 3)}</span>
              </div>
            ))}
          </div>
          
          <div className={`grid flex-1 bg-border gap-px ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-7'}`} style={{ gridTemplateRows: `repeat(${displayDays.length / (view === 'Day' ? 1 : 7)}, minmax(0, 1fr))` }}>
            {displayDays.map((day) => (
              <div 
                key={day.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => day.isCurrentMonth && day.dateStr && handleDrop(e, day.dateStr)}
                className={`bg-card p-1 sm:p-2 transition-colors group relative hover:bg-muted/10 ${view === 'Month' ? 'min-h-[100px]' : 'min-h-[400px]'} ${!day.isCurrentMonth ? 'bg-muted/20' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex size-6 items-center justify-center rounded-full text-xs font-medium
                    ${day.isToday ? 'bg-primary text-primary-foreground' : !day.isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'}`}
                  >
                    {day.number}
                  </span>
                  {day.isCurrentMonth && day.dateStr && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEventDialog(undefined, day.dateStr!); }}
                      className="opacity-0 transition-opacity hover:text-primary sm:group-hover:opacity-100 p-1"
                    >
                      <Plus className="size-3" />
                    </button>
                  )}
                </div>
                
                <div className="mt-1 flex flex-col gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
                  {loading && day.isCurrentMonth ? (
                    Array.from({ length: (day.number % 3) }).map((_, i) => (
                      <div key={i} className="h-4 w-full bg-muted animate-pulse rounded mt-0.5" />
                    ))
                  ) : day.events.map((event) => (
                    <div 
                      key={event.id}
                      draggable={true}
                      onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, event.id) }} 
                      onClick={(e) => { e.stopPropagation(); openEventDialog(event); }}
                      className={`truncate rounded px-1.5 py-1 text-[10px] sm:text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 active:cursor-grabbing ${event.color || 'bg-primary text-primary-foreground'}`}
                      title={`${event.title} (${formatTime(event.start_event)})`}
                    >
                      {formatTime(event.start_event)} {event.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
