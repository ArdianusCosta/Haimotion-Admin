'use client'

import React from 'react'
import { useCalendar } from './calendar/hooks/use-calendar'
import { CalendarHeader } from './calendar/components/calendar-header'
import { EventDialog } from './calendar/dialogs/event-dialog'
import { CalendarSidebar } from './calendar/components/calendar-sidebar'
import { CalendarGrid } from './calendar/components/calendar-grid'

export function CalendarPage() {
  const {
    view, setView, events, loading, currentDate,
    isDialogOpen, setIsDialogOpen, isDeleteDialogOpen, setIsDeleteDialogOpen,
    isSubmitting, selectedEventId, formData, setFormData,
    handlePrevious, handleNext, handleToday, openEventDialog,
    handleSaveEvent, handleDeleteEvent, exportAllEvents,
    handleDragStart, handleDragOver, handleDrop, getGoogleCalendarUrl
  } = useCalendar()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const today = new Date()

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth
    const dateObj = new Date(year, month, dayNumber)
    const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
    
    const dayEvents = isCurrentMonth ? events.filter((e: any) => {
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
    if (i >= 35 && !arr[35].isCurrentMonth) return false
    return true
  })

  let displayDays: any[] = []
  if (view === 'Month') {
    displayDays = calendarDays
  } else if (view === 'Week') {
    const currentDay = currentDate.getDay()
    const startDate = new Date(currentDate)
    startDate.setDate(startDate.getDate() - currentDay)
    
    displayDays = Array.from({ length: 7 }, (_, i) => {
      const dateObj = new Date(startDate)
      dateObj.setDate(startDate.getDate() + i)
      const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
      
      const dayEvents = events.filter((e: any) => {
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
    
    const dayEvents = events.filter((e: any) => {
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

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] flex-col gap-6">
      <CalendarHeader 
        view={view}
        setView={setView}
        exportAllEvents={exportAllEvents}
        openEventDialog={openEventDialog}
      />

      <EventDialog 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isSubmitting={isSubmitting}
        selectedEventId={selectedEventId}
        formData={formData}
        setFormData={setFormData}
        handleSaveEvent={handleSaveEvent}
        handleDeleteEvent={handleDeleteEvent}
        getGoogleCalendarUrl={getGoogleCalendarUrl}
      />

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <CalendarSidebar 
          currentDate={currentDate}
          events={events}
          loading={loading}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          openEventDialog={openEventDialog}
          calendarDays={calendarDays}
        />

        <CalendarGrid 
          view={view}
          currentDate={currentDate}
          displayDays={displayDays}
          loading={loading}
          handleToday={handleToday}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          openEventDialog={openEventDialog}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragStart={handleDragStart}
        />
      </div>
    </div>
  )
}

export default CalendarPage
