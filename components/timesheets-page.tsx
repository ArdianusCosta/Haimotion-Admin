'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '@/app/actions/projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Play, Square, Pause, Clock, Calendar, MoreHorizontal, Briefcase, Plus, Search, Filter, History, Trash2, Edit2, Timer, CheckCircle2, AlertCircle, Video, Download, PlayCircle } from 'lucide-react'

// Empty initial entries to remove dummy data
const initialEntries: any[] = []

export function TimesheetsPage() {
  const [entries, setEntries] = useState<any[]>(initialEntries)
  const [isTracking, setIsTracking] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [currentTask, setCurrentTask] = useState('')
  const [currentProject, setCurrentProject] = useState('')
  
  // Screen Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const currentEntryIdRef = useRef<string | null>(null)

  // Fetch Projects from Database
  const { data: projectsRes, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  })
  const dbProjects = projectsRes?.data || []

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStartStop = async () => {
    if (!isTracking) {
      // Start tracking
      let newEntryId = Math.random().toString()
      currentEntryIdRef.current = newEntryId

      try {
        // Automatically request screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
        mediaRecorderRef.current = mediaRecorder
        recordedChunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data)
          }
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)
          
          // Update the entry with the video URL
          setEntries(prev => prev.map(entry => 
            entry.id === newEntryId ? { ...entry, videoUrl: url } : entry
          ))
          
          // Stop all tracks to remove the recording indicator in browser
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsTracking(true)
      } catch (err) {
        console.error("Screen recording access denied or failed:", err)
        // If user denies permission, we abort starting the timer.
        // Alerting the user since recording is mandatory
        alert("Screen recording permission is required to start the timer.")
        return
      }
    } else {
      // Stop tracking
      const durationStr = `${Math.floor(elapsedTime / 3600)}h ${Math.floor((elapsedTime % 3600) / 60)}m`
      const newEntry = {
        id: currentEntryIdRef.current || Math.random().toString(),
        task: currentTask || 'Untitled Task',
        project: currentProject || 'No Project',
        date: new Date().toISOString().split('T')[0],
        startTime: 'Now', // Mock for now until persistent DB
        endTime: 'Just Now', // Mock
        duration: durationStr === '0h 0m' ? '< 1m' : durationStr,
        billable: true,
        videoUrl: undefined // will be updated if recording completed
      }
      
      setEntries([newEntry, ...entries])
      setElapsedTime(0)
      setCurrentTask('')
      setCurrentProject('')
      setIsTracking(false)

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop() // This triggers onstop
      }
      currentEntryIdRef.current = null
    }
  }

  // Calculate some dummy stats based on current entries
  const totalWeeklyHours = '0h 0m'
  const totalBillable = '$0.00'

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground mt-1">Track your time, analyze productivity, and manage billable hours.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2"><Calendar className="size-4" /> This Week</Button>
          <Button className="gap-2"><Plus className="size-4" /> Manual Entry</Button>
        </div>
      </div>

      {/* Quick Timer Card */}
      <Card className={`border-2 shadow-lg transition-all duration-300 ${isTracking ? 'border-primary/50 shadow-primary/20' : 'border-border'}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
            <div className="w-full lg:flex-1">
              <Input 
                placeholder="What are you working on?" 
                className="text-lg bg-transparent border-0 border-b-2 border-border focus-visible:ring-0 focus-visible:border-primary rounded-none px-0"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                disabled={isTracking}
              />
            </div>
            
            <div className="w-full lg:w-64">
              <Select value={currentProject} onValueChange={setCurrentProject} disabled={isTracking || isLoadingProjects}>
                <SelectTrigger className="w-full border-0 border-b-2 border-border focus:ring-0 rounded-none px-0 shadow-none">
                  <SelectValue placeholder={isLoadingProjects ? "Loading Projects..." : "Select Project"} />
                </SelectTrigger>
                <SelectContent>
                  {dbProjects.map((p: any) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                  {dbProjects.length === 0 && !isLoadingProjects && (
                    <SelectItem value="none" disabled>No Projects Found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-3">
                <Badge variant={isTracking ? 'default' : 'secondary'} className={`px-3 py-1 text-base font-mono tabular-nums transition-colors ${isTracking ? 'animate-pulse bg-primary/20 text-primary hover:bg-primary/30' : ''}`}>
                  {formatTime(elapsedTime)}
                </Badge>
              </div>
              <Button 
                size="lg" 
                variant={isTracking ? "destructive" : "default"} 
                className={`gap-2 min-w-[120px] rounded-full transition-all duration-300 ${isTracking ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(var(--primary),0.5)] hover:scale-105'}`}
                onClick={handleStartStop}
              >
                {isTracking ? <><Square className="size-5 fill-current" /> Stop</> : <><Play className="size-5 fill-current" /> Start</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Clock className="size-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Time (This Week)</p>
              <h3 className="text-2xl font-bold">{totalWeeklyHours}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><Briefcase className="size-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billable Amount</p>
              <h3 className="text-2xl font-bold">{totalBillable}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Timer className="size-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
              <h3 className="text-2xl font-bold">100%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Log */}
      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2"><History className="size-5" /> Recent Entries</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search entries..." className="pl-8 w-[200px] h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2"><Filter className="size-4" /> Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Task Description</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time Window</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Billable</th>
                  <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No timesheet entries yet. Start the timer to create one!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <tr key={entry.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx === entries.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-4 py-4 font-medium">{entry.task}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-primary" />
                          {entry.project}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{entry.date}</td>
                      <td className="px-4 py-4 text-muted-foreground">{entry.startTime} - {entry.endTime}</td>
                      <td className="px-4 py-4 font-semibold">{entry.duration}</td>
                      <td className="px-4 py-4">
                        {entry.billable ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                            <CheckCircle2 className="size-3" /> Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
                            <AlertCircle className="size-3" /> No
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {entry.videoUrl && (
                            <>
                              <Dialog>
                                <DialogTrigger render={
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" title="Preview Recording">
                                    <PlayCircle className="size-4" />
                                  </Button>
                                } />
                                <DialogContent className="sm:max-w-[700px] bg-card p-0 overflow-hidden border-0">
                                  <DialogHeader className="p-4 border-b border-border/50 bg-muted/20">
                                    <DialogTitle>Recording: {entry.task}</DialogTitle>
                                  </DialogHeader>
                                  <video src={entry.videoUrl} controls autoPlay className="w-full max-h-[70vh] object-contain bg-black" />
                                </DialogContent>
                              </Dialog>
                              <a href={entry.videoUrl} download={`recording-${entry.task.replace(/\s+/g, '-').toLowerCase()}.webm`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" title="Download Recording">
                                  <Download className="size-4" />
                                </Button>
                              </a>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="size-4" /></Button>
                            } />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Edit2 className="size-4 mr-2" /> Edit Entry</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500"><Trash2 className="size-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
