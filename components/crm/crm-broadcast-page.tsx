'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Send, Users, MessageSquare, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function CrmBroadcastPage() {
  const [isSending, setIsSending] = useState(false)
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
    // Simulate API call
    setTimeout(() => {
      setIsSending(false)
      toast.success('Broadcast campaign queued successfully!')
      setFormData(prev => ({...prev, message: '', subject: ''}))
    }, 1500)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Broadcast Center</h2>
          <p className="text-muted-foreground mt-1">Send bulk messages to your leads and clients.</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Note on Broadcasts</AlertTitle>
        <AlertDescription>
          This is a preview of the Broadcast module. Actual sending requires integration with a WhatsApp API provider (e.g., Twilio, Meta Cloud API) or Email provider (e.g., Resend, SendGrid).
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSend} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>Write your broadcast message. Use {'{name}'} to personalize.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.channel === 'email' && (
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input 
                    placeholder="e.g. Special Offer for You!" 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Message Content</Label>
                <Textarea 
                  className="min-h-[200px]"
                  placeholder="Hi {name}, we have a special promotion..."
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.audience} 
                onValueChange={v => setFormData({...formData, audience: v})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_leads" id="all_leads" />
                  <Label htmlFor="all_leads" className="cursor-pointer">All Leads</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new_leads" id="new_leads" />
                  <Label htmlFor="new_leads" className="cursor-pointer">New Leads Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_clients" id="all_clients" />
                  <Label htmlFor="all_clients" className="cursor-pointer">All Clients</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active_clients" id="active_clients" />
                  <Label htmlFor="active_clients" className="cursor-pointer">Active Clients</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.channel} 
                onValueChange={v => setFormData({...formData, channel: v})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="cursor-pointer">Email</Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Button type="submit" className="w-full gap-2" disabled={isSending}>
                {isSending ? 'Sending...' : (
                  <>
                    <Send className="h-4 w-4" /> Send Broadcast
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
