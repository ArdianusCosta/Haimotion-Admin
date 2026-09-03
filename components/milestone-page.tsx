'use client'

import { useState } from 'react'
import { Calendar, CheckCircle2, ChevronDown, Clock, Edit2, Flag, MoreVertical, Plus, Trash2, ArrowLeft, MessageCircle, Image as ImageIcon, RefreshCw, FileText } from 'lucide-react'

const initialMilestones = [
  { id: 1, title: 'Beta Release v0.9', description: 'Internal testing for core modules.', date: 'Oct 15, 2026', progress: 100, status: 'completed', tasks: { total: 45, done: 45 } },
  { id: 2, title: 'Public Launch v1.0', description: 'Production release with full features.', date: 'Nov 01, 2026', progress: 65, status: 'in-progress', tasks: { total: 120, done: 78 } },
  { id: 3, title: 'Mobile App Integration', description: 'API endpoints for iOS and Android apps.', date: 'Dec 10, 2026', progress: 10, status: 'in-progress', tasks: { total: 60, done: 6 } },
  { id: 4, title: 'Q1 Performance Optimization', description: 'Refactoring queries and adding Redis caching.', date: 'Jan 20, 2027', progress: 0, status: 'planned', tasks: { total: 30, done: 0 } }
]

const mockTimelineEvents = [
  { id: 1, type: 'task', title: 'Completed task: Optimize DB Queries', time: 'Today, 10:30 AM', user: 'Jordan Davis', icon: CheckCircle2, color: 'text-green-500 border-green-500/20 bg-green-500/10' },
  { id: 2, type: 'comment', title: 'Jordan Davis left a comment', description: '"I think we need to rethink the database schema for the user profiles before we proceed. The current approach might cause bottlenecks when we scale."', time: 'Yesterday, 2:15 PM', user: 'Jordan Davis', icon: MessageCircle, color: 'text-blue-500 border-blue-500/20 bg-blue-500/10' },
  { id: 3, type: 'upload', title: 'Uploaded 3 new design assets', time: 'Oct 12, 2026, 9:00 AM', user: 'Alice Smith', icon: ImageIcon, color: 'text-orange-500 border-orange-500/20 bg-orange-500/10', images: true },
  { id: 4, type: 'document', title: 'Updated API Documentation', time: 'Oct 11, 2026, 11:20 AM', user: 'Jordan Davis', icon: FileText, color: 'text-purple-500 border-purple-500/20 bg-purple-500/10' },
  { id: 5, type: 'status', title: 'Milestone status changed to In Progress', time: 'Oct 10, 2026, 4:45 PM', user: 'System', icon: RefreshCw, color: 'text-primary border-primary/20 bg-primary/10' },
]

export function MilestonePage() {
  const [milestones] = useState(initialMilestones)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20'
      case 'planned': return 'bg-muted text-muted-foreground border-border'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in-progress': return 'In Progress'
      case 'planned': return 'Planned'
      default: return 'Unknown'
    }
  }

  // Find the selected milestone data
  const milestoneDetail = selectedMilestone ? milestones.find(m => m.id === selectedMilestone) : null

  if (selectedMilestone && milestoneDetail) {
    return (
      <div className="mx-auto max-w-4xl py-6 animate-in fade-in duration-500">
        {/* Detail Header */}
        <button 
          onClick={() => setSelectedMilestone(null)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
        >
          <ArrowLeft className="size-4" />
          Back to Milestones
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">{milestoneDetail.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${getStatusColor(milestoneDetail.status)}`}>
                  {getStatusLabel(milestoneDetail.status)}
                </span>
              </div>
              <p className="text-muted-foreground">{milestoneDetail.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                <Calendar className="size-4" />
                Due {milestoneDetail.date}
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="font-medium">{milestoneDetail.progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${milestoneDetail.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} 
                style={{ width: `${milestoneDetail.progress}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <h2 className="text-xl font-bold mb-6">Activity Timeline</h2>
        
        <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.75rem] md:before:ml-[2.25rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
          {mockTimelineEvents.map((event, i) => (
            <div key={event.id} className="relative flex items-start justify-between">
              
              {/* Timeline Icon */}
              <div className={`absolute left-0 -translate-x-1/2 flex size-10 items-center justify-center rounded-full border-4 border-background ${event.color} shadow-sm ring-1 ring-border/50 z-10`}>
                <event.icon className="size-4" />
              </div>

              {/* Event Content */}
              <div className="w-full pl-8 md:pl-12 py-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3" />
                    {event.time}
                  </span>
                </div>
                
                {event.description && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground/80 relative">
                    <div className="absolute left-4 top-0 -translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-muted/30 border-l border-t border-border" />
                    {event.description}
                  </div>
                )}

                {event.images && (
                  <div className="mt-3 flex gap-3">
                    {[1, 2, 3].map(img => (
                      <div key={img} className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center border border-border/50 text-xs text-muted-foreground font-medium shadow-sm overflow-hidden relative group cursor-pointer">
                        <ImageIcon className="size-4 opacity-50" />
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-accent-foreground">
                    {event.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{event.user}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    )
  }

  // Main List View
  return (
    <div className="mx-auto max-w-5xl py-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Milestones</h1>
          <p className="text-muted-foreground mt-1">Track major goals, releases, and key deliverables.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm w-fit">
          <Plus className="size-4" />
          Create Milestone
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <CheckCircle2 className="size-5 text-green-500" />
            <h3 className="text-sm font-medium">Completed</h3>
          </div>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Clock className="size-5 text-primary" />
            <h3 className="text-sm font-medium">In Progress</h3>
          </div>
          <p className="text-2xl font-bold">2</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Flag className="size-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">Planned</h3>
          </div>
          <p className="text-2xl font-bold">1</p>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div 
            key={milestone.id} 
            className="group relative rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedMilestone(milestone.id)}
          >
            <div className="flex flex-col sm:flex-row gap-5">
              
              {/* Left Side: Status Icon */}
              <div className="hidden sm:flex flex-col items-center mt-1">
                <div className={`flex size-10 items-center justify-center rounded-full border-2 ${
                  milestone.status === 'completed' ? 'border-green-500 bg-green-500/10 text-green-500' :
                  milestone.status === 'in-progress' ? 'border-primary bg-primary/10 text-primary' :
                  'border-muted-foreground bg-muted text-muted-foreground'
                }`}>
                  {milestone.status === 'completed' ? <CheckCircle2 className="size-5" /> : <Flag className="size-5" />}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold truncate group-hover:text-primary transition-colors">{milestone.title}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${getStatusColor(milestone.status)}`}>
                        {getStatusLabel(milestone.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 shrink-0">
                      <Calendar className="size-4" />
                      {milestone.date}
                    </div>
                    <div className="sm:hidden flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"><Edit2 className="size-4" /></button>
                      <button className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Tasks */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="font-medium">{milestone.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${milestone.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} 
                      style={{ width: `${milestone.progress}%` }} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {milestone.tasks.done} of {milestone.tasks.total} tasks completed
                  </p>
                </div>
              </div>
              
              {/* Actions (Desktop) */}
              <div className="hidden sm:flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors" title="Edit Milestone"><Edit2 className="size-4" /></button>
                <button className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors" title="Delete"><Trash2 className="size-4" /></button>
                <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors" title="More options"><MoreVertical className="size-4" /></button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
