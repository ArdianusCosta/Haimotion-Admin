'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Users,
  MessageSquare,
  AlertCircle,
  Mail,
  Smartphone,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  History,
  Trash2,
  Clock,
  Check,
  Search,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  createCrmBroadcastCampaign,
  getCrmBroadcastCampaigns,
  deleteCrmBroadcastCampaign
} from '@/app/actions/crm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const AUDIENCE_OPTIONS = [
  { value: 'all_leads', label: 'All Leads', desc: 'Target all leads currently registered in CRM', icon: '🎯' },
  { value: 'new_leads', label: 'New Leads', desc: 'Only leads with "New" status', icon: '⚡' },
  { value: 'all_clients', label: 'All Clients', desc: 'Target all registered CRM clients', icon: '🏢' },
  { value: 'active_clients', label: 'Active Clients', desc: 'Only clients marked as "Active"', icon: '✅' },
]

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp', desc: 'Instant messaging with high open rates', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { value: 'email', label: 'Email', desc: 'HTML & structured announcement emails', icon: Mail, color: 'text-sky-600', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
]

export function CrmBroadcastPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose')
  const [isSending, setIsSending] = useState(false)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    audience: 'all_leads',
    channel: 'whatsapp',
    subject: '',
    message: ''
  })

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true)
    try {
      const res = await getCrmBroadcastCampaigns()
      if (res.success && res.data) {
        setCampaigns(res.data)
      } else {
        toast.error(res.error || 'Failed to fetch broadcast campaigns')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Error loading campaigns')
    } finally {
      setIsLoadingCampaigns(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      return toast.error('Please enter a campaign name')
    }
    if (!formData.message.trim()) {
      return toast.error('Message content is required')
    }

    setIsSending(true)
    try {
      const res = await createCrmBroadcastCampaign({
        name: formData.name,
        audience_type: formData.audience,
        channel: formData.channel,
        message: formData.message
      })

      if (res.success) {
        toast.success(`Campaign "${formData.name}" saved! ${res.recipientCount || 0} recipients queued in database.`)
        setFormData({
          name: '',
          audience: 'all_leads',
          channel: 'whatsapp',
          subject: '',
          message: ''
        })
        await fetchCampaigns()
        setActiveTab('history')
      } else {
        toast.error(res.error || 'Failed to queue campaign')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating campaign')
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCandidate) return
    setIsDeleting(true)
    try {
      const res = await deleteCrmBroadcastCampaign(deleteCandidate.id)
      if (res.success) {
        toast.success(`Campaign "${deleteCandidate.name}" deleted.`)
        setCampaigns(prev => prev.filter(c => c.id !== deleteCandidate.id))
        setDeleteCandidate(null)
      } else {
        toast.error(res.error || 'Failed to delete campaign')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting campaign')
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedAudience = AUDIENCE_OPTIONS.find(a => a.value === formData.audience)
  const selectedChannel = CHANNEL_OPTIONS.find(c => c.value === formData.channel)
  const ChannelIcon = selectedChannel?.icon || MessageSquare

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broadcast Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, queue, and manage bulk outreach campaigns for your leads and clients.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl self-start">
          <Button
            size="sm"
            variant={activeTab === 'compose' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('compose')}
            className="gap-2 text-xs"
          >
            <Send className="h-3.5 w-3.5" />
            New Broadcast
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTab('history')
              fetchCampaigns()
            }}
            className="gap-2 text-xs"
          >
            <History className="h-3.5 w-3.5" />
            Campaign Queue ({campaigns.length})
          </Button>
        </div>
      </div>

      {/* Honest Provider Status Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Internal Queue Operational • Gateway Integration Notice
          </p>
          <div className="text-xs text-muted-foreground leading-relaxed">
            Campaigns and snapshot recipient targets are securely stored in the Supabase database (<code className="text-xs bg-muted/50 px-1 py-0.5 rounded">crm_broadcast_campaigns</code> & <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">crm_broadcast_recipients</code>) with status <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-1 bg-amber-500/10 text-amber-600 border-amber-300">Ready</Badge>. Live external delivery requires connecting WhatsApp API (Twilio / Meta Cloud) or Email API (Resend / SendGrid).
          </div>
        </div>
      </div>

      {activeTab === 'compose' ? (
        <form onSubmit={handleSend}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compose Main */}
            <div className="md:col-span-2 space-y-5">
              {/* Campaign Identification */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Megaphone className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Campaign Identity</CardTitle>
                      <CardDescription className="text-xs">Give your broadcast a distinctive name for tracking.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Campaign Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Ramadan Special Promo 2026 / Product Update"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Target Audience */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Target Audience</CardTitle>
                      <CardDescription className="text-xs">Select who will be snapshotted into this broadcast.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <span className="block font-semibold text-sm">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Content */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Message Content</CardTitle>
                      <CardDescription className="text-xs">Template parameters like {'{name}'} will be evaluated on dispatch.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.channel === 'email' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Email Subject <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Exclusive Offer for Hai Motion Partners"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        required={formData.channel === 'email'}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Message Body <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      className="min-h-[180px] resize-none"
                      placeholder={`Halo {name},\n\nKami memiliki pembaruan penting mengenai layanan Hai Motion...\n\nSalam hormat,\nTim Hai Motion`}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Supports emoji 🎉 and multiline text.</span>
                      <span>{formData.message.length} characters</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-5">
              {/* Channel Selector */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base">Dispatch Channel</CardTitle>
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
                          <span className="block font-semibold text-sm text-foreground">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Campaign Review */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Summary & Dispatch</CardTitle>
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
                    <span className={cn('font-semibold flex items-center gap-1 capitalize', selectedChannel?.color)}>
                      <ChannelIcon className="h-3.5 w-3.5" /> {selectedChannel?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Queue Mode</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                      Database Queue
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full gap-2 shadow-lg"
                    disabled={isSending || !formData.name.trim() || !formData.message.trim()}
                  >
                    {isSending ? (
                      <>
                        <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                        Queueing in Database...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Queue Campaign
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      ) : (
        /* History & Queue Tab */
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Queued & Past Campaigns</CardTitle>
                <CardDescription className="text-xs">
                  All broadcast campaigns stored in the database with recipient snapshots.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchCampaigns} disabled={isLoadingCampaigns} className="gap-2 text-xs">
                {isLoadingCampaigns ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCampaigns ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 rounded-full border-2 border-primary border-t-transparent" />
                Loading campaigns from database...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-base font-semibold">No Broadcast Campaigns Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Create your first broadcast campaign to snapshot target leads or clients into the queue.
                  </p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('compose')} className="gap-2">
                  <Send className="h-4 w-4" />
                  Create First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl border border-border/60 hover:border-border transition-all bg-card/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base">{camp.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs uppercase font-medium',
                            camp.channel === 'whatsapp'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                          )}
                        >
                          {camp.channel}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs font-medium',
                            camp.status === 'Ready' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20',
                            camp.status === 'Sent' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20',
                            camp.status === 'Draft' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {camp.status === 'Ready' ? 'Queued (Ready)' : camp.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {camp.audience_type?.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl bg-muted/30 p-2 rounded-lg font-mono">
                        {camp.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          {camp.totalRecipients || camp.recipients?.length || 0} snapshot recipients
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Created: {new Date(camp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8 w-8 p-0"
                        onClick={() => setDeleteCandidate(camp)}
                        title="Delete Campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete campaign <strong className="text-foreground">{deleteCandidate?.name}</strong>? All snapshotted recipients will also be removed from the queue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
