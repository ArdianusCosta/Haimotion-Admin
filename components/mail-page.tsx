'use client'

import { useState } from 'react'
import { Inbox, Send, Archive, Trash2, MoreVertical, Reply, Forward, Search, Star, CheckCircle, PenBox } from 'lucide-react'

const emails = [
  { id: 1, sender: 'Olivia Martin', email: 'olivia.martin@email.com', subject: 'Question about my recent order', date: '10:42 AM', preview: 'Hi there, I wanted to check the status of my order #N-28391. The tracking link seems to be broken.', read: false, starred: true },
  { id: 2, sender: 'Liam Chen', email: 'liam.chen@email.com', subject: 'Refund request', date: 'Yesterday', preview: 'Hello, the item I received was damaged during shipping. How can I go about getting a replacement or refund?', read: true, starred: false },
  { id: 3, sender: 'Stripe', email: 'receipts@stripe.com', subject: 'Payment received: $420.00 from Noah Smith', date: 'Aug 30', preview: 'You received a new payment of $420.00 from Noah Smith. View the transaction details in your Stripe dashboard.', read: true, starred: false },
  { id: 4, sender: 'Ava Williams', email: 'ava.williams@email.com', subject: 'Partnership Inquiry', date: 'Aug 29', preview: 'My name is Ava and I represent a retail chain. We are interested in stocking your products in our stores.', read: false, starred: true },
  { id: 5, sender: 'GitHub', email: 'noreply@github.com', subject: '[haimotion/admin] Dependabot alert: Critical security vulnerability', date: 'Aug 28', preview: 'Dependabot has identified a critical security vulnerability in a dependency used by your project.', read: true, starred: false },
  { id: 6, sender: 'Alex Johnson', email: 'alex@supplier.com', subject: 'Inventory update for next month', date: 'Aug 27', preview: 'We have updated our inventory levels for the upcoming month. Please review the attached spreadsheet for details.', read: true, starred: false },
]

export function MailPage() {
  const [selectedMail, setSelectedMail] = useState(emails[0])
  const [currentFolder, setCurrentFolder] = useState('Inbox')

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] flex-col gap-6 md:flex-row">
      {/* Sidebar / Folders */}
      <div className="flex w-full shrink-0 flex-col gap-6 md:w-52">
        <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <PenBox className="size-4" /> Compose
        </button>
        
        <div className="flex flex-col gap-1">
          <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mailboxes</h2>
          <button onClick={() => setCurrentFolder('Inbox')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${currentFolder === 'Inbox' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Inbox className="size-4" /> Inbox
            <span className="ml-auto flex size-5 items-center justify-center rounded-md bg-primary/20 text-[10px] font-semibold text-primary">2</span>
          </button>
          <button onClick={() => setCurrentFolder('Sent')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${currentFolder === 'Sent' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Send className="size-4" /> Sent
          </button>
          <button onClick={() => setCurrentFolder('Archive')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${currentFolder === 'Archive' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Archive className="size-4" /> Archive
          </button>
          <button onClick={() => setCurrentFolder('Trash')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${currentFolder === 'Trash' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Trash2 className="size-4" /> Trash
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card md:w80 lg:w-[350px]">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <Search className="size-4 text-muted-foreground" />
            <input placeholder="Search emails..." className="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelectedMail(email)}
              className={`flex w-full flex-col items-start gap-1 border-b border-border p-4 text-left transition-colors hover:bg-muted/50 ${selectedMail?.id === email.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm font-medium ${email.read ? 'text-foreground' : 'text-foreground font-semibold'}`}>{email.sender}</span>
                <span className="text-[10px] text-muted-foreground">{email.date}</span>
              </div>
              <p className={`text-xs ${email.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>{email.subject}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{email.preview}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Email View */}
      <div className="hidden flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card md:flex">
        {selectedMail ? (
          <>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex gap-1.5">
                <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Archive"><Archive className="size-4" /></button>
                <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Mark as read"><CheckCircle className="size-4" /></button>
                <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Trash"><Trash2 className="size-4" /></button>
              </div>
              <div className="flex gap-1.5">
                <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Reply"><Reply className="size-4" /></button>
                <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Forward"><Forward className="size-4" /></button>
                <div className="mx-1 h-5 w-px self-center bg-border" />
                <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="More options"><MoreVertical className="size-4" /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-chart-2/15 text-sm font-semibold text-chart-2">
                    {selectedMail.sender.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedMail.sender}</h2>
                    <p className="text-xs text-muted-foreground">{selectedMail.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{selectedMail.date}</span>
                  <button className="text-muted-foreground transition-colors hover:text-yellow-400">
                    <Star className={`size-4 ${selectedMail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="mt-8">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">{selectedMail.subject}</h1>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <p>{selectedMail.preview}</p>
                  <p className="mt-4">Could you please look into this and let me know as soon as possible? I would really appreciate a quick resolution.</p>
                  <p className="mt-6">Thanks,<br />{selectedMail.sender.split(' ')[0]}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-border p-4 bg-muted/20">
              <div className="rounded-xl border border-border bg-background p-3 shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                <textarea 
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" 
                  placeholder={`Reply to ${selectedMail.sender}...`}
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Press <kbd className="rounded border border-border px-1">Cmd</kbd> + <kbd className="rounded border border-border px-1">Enter</kbd> to send</span>
                  <button className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">Send Reply</button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Inbox className="mb-4 size-10 opacity-20" />
            <p className="text-sm font-medium">No message selected</p>
            <p className="mt-1 text-xs">Select a message from the list to view it</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MailPage
