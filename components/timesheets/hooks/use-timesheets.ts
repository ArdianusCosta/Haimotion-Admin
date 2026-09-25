import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '@/app/actions/projects'

const initialEntries: any[] = []

export function useTimesheets() {
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

  return {
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
  }
}
