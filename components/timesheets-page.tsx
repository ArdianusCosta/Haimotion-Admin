'use client'

import React from 'react'
import { useTimesheets } from './timesheets/hooks/use-timesheets'
import { TimesheetHeader } from './timesheets/components/timesheet-header'
import { TimerCard } from './timesheets/components/timer-card'
import { StatsWidgets } from './timesheets/components/stats-widgets'
import { TimesheetLog } from './timesheets/components/timesheet-log'

export function TimesheetsPage() {
  const {
    entries,
    isTracking,
    elapsedTime,
    currentTask,
    setCurrentTask,
    currentProject,
    setCurrentProject,
    dbProjects,
    isLoadingProjects,
    handleStartStop,
    formatTime,
    totalWeeklyHours,
    totalBillable
  } = useTimesheets()

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TimesheetHeader />

      <TimerCard 
        isTracking={isTracking}
        elapsedTime={elapsedTime}
        formatTime={formatTime}
        currentTask={currentTask}
        setCurrentTask={setCurrentTask}
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
        dbProjects={dbProjects}
        isLoadingProjects={isLoadingProjects}
        handleStartStop={handleStartStop}
      />

      <StatsWidgets 
        totalWeeklyHours={totalWeeklyHours}
        totalBillable={totalBillable}
      />

      <TimesheetLog entries={entries} />
    </div>
  )
}
