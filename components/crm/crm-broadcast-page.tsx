'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Send, Users, MessageSquare, AlertCircle, Mail, Smartphone, Megaphone, CheckCircle2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const AUDIENCE_OPTIONS = [
  { value: 'all_leads', label: 'All Leads', desc: 'Send to all leads in database', icon: '🎯' },
  { value: 'new_leads', label: 'New Leads', desc: 'Only newly added leads', icon: '⚡' },
  { value: 'all_clients', label: 'All Clients', desc: 'Send to all active clients', icon: '🏢' },
  { value: 'active_clients', label: 'Active Clients', desc: 'Only active client accounts', icon: '✅' },
]

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp', desc: 'Rich messaging with media support', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { value: 'email', label: 'Email', desc: 'HTML & plain text emails', icon: Mail, color: 'text-sky-600', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
]

export function CrmBroadcastPage() {
  const [isSending, setIsSending] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    audience: 'all_leads',
    channel: 'whatsapp',
    subject: '',
    message: ''
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.message) {
      return toast.error('Message content is required')
    }
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      toast.success('Broadcast campaign queued successfully!')
      setFormData(prev => ({ ...prev, message: '', subject: '' }))
      setStep(1)
    }, 1500)
  }

  const selectedAudience = AUDIENCE_OPTIONS.find(a => a.value === formData.audience)
  const selectedChannel = CHANNEL_OPTIONS.find(c => c.value === formData.channel)
  const ChannelIcon = selectedChannel?.icon || MessageSquare

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcast Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Send bulk messages to your leads and clients at scale.</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Integration Required</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actual sending requires a WhatsApp API provider (Twilio, Meta Cloud) or Email provider (Resend, SendGrid). This is a preview.
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                s < step ? 'bg-emerald-500 text-white' : s === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={cn('text-sm hidden md:block', s === step ? 'font-semibold' : 'text-muted-foreground')}>
              {s === 1 ? 'Audience & Channel' : s === 2 ? 'Compose Message' : 'Review & Send'}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Compose */}
          <div className="md:col-span-2 space-y-5">
            {/* Audience */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Target Audience</CardTitle>
                    <CardDescription className="text-xs">Who will receive this broadcast?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, audience: opt.value })}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                        formData.audience === opt.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <span className="text-xl mt-0.5">{opt.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compose */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Compose Message</CardTitle>
                    <CardDescription className="text-xs">Use {'{name}'} to personalize your message.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.channel === 'email' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Line</Label>
                    <Input
                      placeholder="e.g. Special Offer for You!"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message Content</Label>
                  <Textarea
                    className="min-h-[180px] resize-none"
                    placeholder={`Hi {name}, we have an exciting update for you...\n\nBest regards,\nThe Team`}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Supports emoji 🎉 and basic formatting.</p>
                    <span className="text-xs text-muted-foreground">{formData.message.length} chars</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Channel */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base">Channel</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {CHANNEL_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, channel: opt.value })}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                        formData.channel === opt.value
                          ? `border-current ${opt.bg} ${opt.color}`
                          : 'border-border/50 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', opt.bg)}>
                        <Icon className={cn('h-4 w-4', opt.color)} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Summary Preview */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Audience</span>
                  <span className="font-semibold flex items-center gap-1">
                    {selectedAudience?.icon} {selectedAudience?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Channel</span>
                  <span className={cn('font-semibold flex items-center gap-1', selectedChannel?.color)}>
                    <ChannelIcon className="h-3.5 w-3.5" /> {selectedChannel?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Characters</span>
                  <span className="font-semibold">{formData.message.length}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full gap-2 shadow-lg" disabled={isSending || !formData.message}>
                  {isSending ? (
                    <>
                      <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Broadcast
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
