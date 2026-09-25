'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/components/language-provider'
import { useCreateMeeting, useMeetingFormData } from '@/hooks/use-meetings'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Check, Globe, Lock, Clock, Users, ArrowLeft } from 'lucide-react'

export function CreateMeetingPage({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage()
  const { mutate: createMeeting, isPending } = useCreateMeeting()
  const { data: formData, isLoading } = useMeetingFormData()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState('60')
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  const [joinPolicy, setJoinPolicy] = useState<'PUBLIC_LINK' | 'INVITED_ONLY'>('PUBLIC_LINK')
  const [waitingRoom, setWaitingRoom] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  
  const [projectId, setProjectId] = useState<number | undefined>()
  const [taskId, setTaskId] = useState<number | undefined>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dateTime = new Date(`${date}T${startTime}`)
    createMeeting({
      title,
      description,
      isoDateTime: dateTime.toISOString(),
      duration: parseInt(duration),
      participants: selectedParticipants,
      joinPolicy,
      waitingRoom,
      passcode: showPasscode && passcode ? passcode : undefined,
      projectId,
      taskId
    }, {
      onSuccess: () => onBack()
    })
  }

  const toggleParticipant = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full size-10 shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Schedule Meeting')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new meeting and invite participants
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <form id="meeting-form" onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Basic Info & Schedule */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="mtg-title">{t('Title')} <span className="text-destructive">*</span></Label>
                  <Input id="mtg-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Weekly Sync" className="h-10" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mtg-description">{t('Description')}</Label>
                  <Textarea id="mtg-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional agenda or notes..." rows={3} className="resize-none" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mtg-date">{t('Date')} <span className="text-destructive">*</span></Label>
                    <Input id="mtg-date" type="date" required value={date} onChange={e => setDate(e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mtg-time">{t('Start Time')} <span className="text-destructive">*</span></Label>
                    <Input id="mtg-time" type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mtg-duration">
                    <span className="flex items-center gap-1.5"><Clock className="size-4 text-muted-foreground" />{t('Duration')}</span>
                  </Label>
                  <select id="mtg-duration" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring" value={duration} onChange={e => setDuration(e.target.value)}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Project Context <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span></h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('Project')}</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none" value={projectId || ''} onChange={e => setProjectId(e.target.value ? parseInt(e.target.value) : undefined)}>
                      <option value="">{t('None')}</option>
                      {formData?.projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('Task')}</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none" value={taskId || ''} onChange={e => setTaskId(e.target.value ? parseInt(e.target.value) : undefined)}>
                      <option value="">{t('None')}</option>
                      {formData?.tasks.map((t: any) => <option key={t.id} value={t.id}>{t.task}</option>)}
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Security & Participants */}
            <div className="space-y-6">
              
              <div className="space-y-4 bg-muted/30 p-5 rounded-lg border">
                <h3 className="text-base font-medium">Meeting Security</h3>

                {/* Join Policy */}
                <div className="space-y-3">
                  <Label>Join Policy</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setJoinPolicy('PUBLIC_LINK')}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors text-left ${joinPolicy === 'PUBLIC_LINK' ? 'border-primary bg-primary/5 text-primary' : 'border-input bg-background hover:bg-muted/50'}`}
                    >
                      <Globe className="size-5 shrink-0" />
                      <div>
                        <div className="font-medium">Anyone with link</div>
                        <div className="text-xs text-muted-foreground">Guest users can join</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinPolicy('INVITED_ONLY')}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors text-left ${joinPolicy === 'INVITED_ONLY' ? 'border-primary bg-primary/5 text-primary' : 'border-input bg-background hover:bg-muted/50'}`}
                    >
                      <Lock className="size-5 shrink-0" />
                      <div>
                        <div className="font-medium">Invited only</div>
                        <div className="text-xs text-muted-foreground">Only invited internal members</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  {/* Waiting Room */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Waiting Room</div>
                      <div className="text-xs text-muted-foreground">Admit participants one by one</div>
                    </div>
                    <Switch checked={waitingRoom} onCheckedChange={setWaitingRoom} id="waiting-room" />
                  </div>

                  {/* Passcode */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Meeting Passcode</div>
                        <div className="text-xs text-muted-foreground">Require a code to join</div>
                      </div>
                      <Switch checked={showPasscode} onCheckedChange={setShowPasscode} id="passcode-toggle" />
                    </div>
                    {showPasscode && (
                      <Input
                        value={passcode}
                        onChange={e => setPasscode(e.target.value)}
                        placeholder="Enter passcode..."
                        className="h-9 bg-background"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-base">
                    <Users className="size-4" />
                    {t('Invite Participants')}
                  </Label>
                  {selectedParticipants.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                      {selectedParticipants.length} selected
                    </span>
                  )}
                </div>
                
                <div className="border rounded-lg overflow-hidden bg-background">
                  <div className="h-[280px] overflow-y-auto">
                    {isLoading ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">Loading users...</div>
                    ) : (
                      <div className="divide-y">
                        {formData?.users.map((user: any) => {
                          const cleanName = user.firstname?.replace(/^\[.*?\]\s*/, '') || user.firstname;
                          const fallbackChar = cleanName ? cleanName[0] : '?';
                          return (
                            <div
                              key={user.id}
                              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedParticipants.includes(user.id) ? 'bg-primary/5' : ''}`}
                              onClick={() => toggleParticipant(user.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="text-xs">{fallbackChar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{user.firstname} {user.lastname}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                              {selectedParticipants.includes(user.id)
                                ? <div className="size-5 rounded-full bg-primary flex items-center justify-center"><Check className="size-3 text-primary-foreground" /></div>
                                : <div className="size-5 rounded-full border border-input" />
                              }
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </form>
        
        <div className="flex items-center justify-end gap-3 px-6 py-5 bg-muted/40 border-t">
          <Button type="button" variant="outline" onClick={onBack} disabled={isPending} className="px-6">
            {t('Cancel')}
          </Button>
          <Button type="submit" form="meeting-form" disabled={isPending} className="px-8">
            {isPending ? 'Scheduling...' : t('Schedule Meeting')}
          </Button>
        </div>
      </div>
    </div>
  )
}
