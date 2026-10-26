'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createProject, getProjects } from '@/app/actions/projects'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Loader2,
  Check,
  Search,
  CalendarDays,
  Users,
  ShieldCheck,
  Sparkles,
  Building2,
  FileText,
  FolderPlus,
  CheckCircle2,
  Clock,
  Layers,
  X,
  ChevronRight,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { STATUS_LABELS } from './project-list-view'

interface UserItem {
  id: number
  firstname: string
  lastname?: string
  avatar?: string | null
  email?: string
}

interface CreateProjectPageProps {
  onBack: () => void
  users?: UserItem[]
}

const STATUS_OPTIONS = [
  {
    value: 1,
    title: 'Pending',
    desc: 'Awaiting kickoff or client approvals',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  {
    value: 2,
    title: 'Active',
    desc: 'Actively in development & execution',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    value: 0,
    title: 'On Hold',
    desc: 'Temporarily paused or blocked',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    value: 5,
    title: 'Completed',
    desc: 'All deliverables finished',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
]

export const isUserActive = (u: any) => {
  if (!u) return false
  if (u.status && u.status.toLowerCase() === 'resign') return false
  if (u.firstname && u.firstname.toUpperCase().includes('[RESIGN]')) return false
  if (u.lastname && u.lastname.toUpperCase().includes('[RESIGN]')) return false
  if (u.name && u.name.toUpperCase().includes('[RESIGN]')) return false
  return true
}

export function CreateProjectPage({ onBack, users: initialUsers = [] }: CreateProjectPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fallback query to load users if not passed in
  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: initialUsers.length === 0,
  })

  const rawUsers: UserItem[] = initialUsers.length > 0 ? initialUsers : (projectsRes?.users || [])
  const activeUsers = useMemo(() => rawUsers.filter(isUserActive), [rawUsers])

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    description: '',
    status: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    manager_id: '',
    user_ids: [] as number[],
  })

  const [memberSearch, setMemberSearch] = useState('')

  // Selected manager object
  const selectedManager = useMemo(() => {
    if (!formData.manager_id) return null
    return activeUsers.find((u) => u.id.toString() === formData.manager_id.toString()) || null
  }, [formData.manager_id, activeUsers])

  // Selected members objects
  const selectedMembers = useMemo(() => {
    const idSet = new Set(formData.user_ids.map(Number))
    return activeUsers.filter((u) => idSet.has(Number(u.id)))
  }, [formData.user_ids, activeUsers])

  // Filtered members by search (strictly active users only)
  const filteredUsers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return activeUsers
    return activeUsers.filter((u) => {
      const fullName = `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      return fullName.includes(q) || email.includes(q)
    })
  }, [memberSearch, activeUsers])

  // Calculate project duration in days
  const durationDays = useMemo(() => {
    try {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return 0
    }
  }, [formData.start_date, formData.end_date])

  const toggleMember = (userId: number) => {
    const targetId = Number(userId)
    setFormData((prev) => {
      const current = prev.user_ids.map(Number)
      return {
        ...prev,
        user_ids: current.includes(targetId)
          ? current.filter((id) => id !== targetId)
          : [...current, targetId],
      }
    })
  }

  const selectAllMembers = () => {
    setFormData((prev) => ({
      ...prev,
      user_ids: activeUsers.map((u) => Number(u.id)),
    }))
  }

  const clearAllMembers = () => {
    setFormData((prev) => ({
      ...prev,
      user_ids: [],
    }))
  }

  // Mutation to create project
  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        client_name: data.client_name.trim() || undefined,
        status: parseInt(data.status.toString()) || 1,
        start_date: data.start_date,
        end_date: data.end_date,
        manager_id: parseInt(data.manager_id) || 0,
        user_ids: data.user_ids,
      }
      return createProject(payload)
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Project created successfully!')
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        onBack()
      } else {
        toast.error(res.error || 'Failed to create project')
      }
    },
    onError: (err: any) => {
      console.error(err)
      toast.error('An unexpected error occurred while creating project')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a project name')
      return
    }

    if (!formData.manager_id) {
      toast.error('Please select a Project Manager')
      return
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be earlier than start date')
      return
    }

    mutation.mutate(formData)
  }

  return (
    <div className="min-h-full pb-20 animate-in fade-in duration-200">
      {/* Top Header / Breadcrumbs Bar */}
      <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Layers className="size-3.5" />
              <span>Projects</span>
            </button>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">New Project</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onBack}
              className="size-8 rounded-lg shrink-0 border-border/80 hover:bg-muted"
              title="Back to Projects"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Create New Project
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Set up project scope, timeline, manager, and team collaborators.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={mutation.isPending}
            className="h-9 px-4 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="h-9 gap-2 px-5 text-xs font-medium shadow-sm"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            <span>{mutation.isPending ? 'Creating...' : 'Create Project'}</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Form Columns (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Card 1: General Information */}
            <Card className="border-border/70 shadow-sm bg-card">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderPlus className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">General Information</CardTitle>
                    <CardDescription className="text-xs">
                      Provide basic details and context about this project.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* Project Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="project-name" className="text-xs font-semibold text-foreground">
                      Project Name <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Required</span>
                  </div>
                  <Input
                    id="project-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Website Redesign & Brand Identity"
                    required
                    autoFocus
                    className="h-10 text-sm focus-visible:ring-1"
                  />
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="client-name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <span>Client / Organization</span>
                    <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="client-name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="e.g. Acme Corporation or Internal"
                    className="h-10 text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="project-desc" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Project Description</span>
                  </Label>
                  <Textarea
                    id="project-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Outline the goals, deliverables, milestone scope, and key objectives of this project..."
                    rows={4}
                    className="resize-y text-sm leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Timeline & Status */}
            <Card className="border-border/70 shadow-sm bg-card">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <CalendarDays className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Timeline & Initial Status</CardTitle>
                    <CardDescription className="text-xs">
                      Define the schedule boundaries and current project state.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* Dates Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-xs font-semibold text-foreground">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-xs font-semibold text-foreground">
                      Target Due Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="end-date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration indicator banner */}
                <div
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs transition-colors ${
                    durationDays < 0
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-border/70 bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="size-3.5" />
                    <span>
                      {durationDays < 0
                        ? 'Invalid date range: End date is before Start date'
                        : `Estimated Duration: ${durationDays} day${durationDays === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80">
                    {new Date(formData.start_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    —{' '}
                    {new Date(formData.end_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Status Selection Cards */}
                <div className="space-y-2.5 pt-1">
                  <Label className="text-xs font-semibold text-foreground">Initial Status</Label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = formData.status === opt.value
                      return (
                        <div
                          key={opt.value}
                          onClick={() => setFormData({ ...formData, status: opt.value })}
                          className={`group flex cursor-pointer items-start justify-between rounded-xl border p-3 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                              : 'border-border/70 bg-card hover:border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">{opt.title}</span>
                              <span
                                className={`rounded-full px-2 py-0.2 text-[10px] font-semibold border ${opt.badgeClass}`}
                              >
                                {opt.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight">{opt.desc}</p>
                          </div>
                          <div
                            className={`flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border group-hover:border-muted-foreground/60'
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[2.5]" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Project Leadership */}
            <Card className="border-border/70 shadow-sm bg-card">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Project Leadership</CardTitle>
                    <CardDescription className="text-xs">
                      Assign the Project Manager responsible for milestone tracking and decisions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pm-select" className="text-xs font-semibold text-foreground">
                      Project Manager <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Required</span>
                  </div>

                  <select
                    id="pm-select"
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="">-- Choose an Active Project Manager --</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.firstname} {u.lastname || ''} {u.email ? `(${u.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected PM Banner Preview */}
                {selectedManager && (
                  <div className="flex items-center gap-3.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 transition-all animate-in fade-in">
                    <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                      {selectedManager.avatar ? (
                        <img
                          src={selectedManager.avatar}
                          alt=""
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <span>
                          {selectedManager.firstname?.charAt(0)}
                          {selectedManager.lastname?.charAt(0)}
                        </span>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {selectedManager.firstname} {selectedManager.lastname || ''}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                          Lead PM
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{selectedManager.email || 'No email'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 4: Team Members & Collaborators */}
            <Card className="border-border/70 shadow-sm bg-card">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Team Members</CardTitle>
                      <CardDescription className="text-xs">
                        Assign team collaborators who can view and work on this project.
                      </CardDescription>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                    {formData.user_ids.length} Selected
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {/* Search & Bulk Actions Bar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search member by name or email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="h-9 pl-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllMembers}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Select All
                    </Button>
                    <span className="text-muted-foreground/40">|</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllMembers}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Selected Member Chips */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 max-h-24 overflow-y-auto">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-2xs"
                      >
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                          {m.firstname?.charAt(0)}
                        </span>
                        <span className="max-w-[120px] truncate">{m.firstname}</span>
                        <button
                          type="button"
                          onClick={() => toggleMember(m.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                          title="Remove"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Member Checklist List */}
                <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border divide-y divide-border/60">
                  {filteredUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No team members found matching &quot;{memberSearch}&quot;.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = formData.user_ids.map(Number).includes(Number(u.id))
                      const isPM = formData.manager_id.toString() === u.id.toString()
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleMember(u.id)}
                          className={`flex cursor-pointer items-center justify-between p-3 text-xs transition-colors hover:bg-muted/50 ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground text-xs border">
                              {u.avatar ? (
                                <img src={u.avatar} alt="" className="size-8 rounded-full object-cover" />
                              ) : (
                                <span>
                                  {u.firstname?.charAt(0)}
                                  {u.lastname?.charAt(0)}
                                </span>
                              )}
                              {isPM && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-background"
                                  title="Project Manager"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground truncate">
                                  {u.firstname} {u.lastname || ''}
                                </span>
                                {isPM && (
                                  <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-amber-600 border border-amber-500/20">
                                    PM
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate block">
                                {u.email || 'No email registered'}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card'
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[2.5]" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (4 cols) - Live Card Preview & Summary */}
          <div className="space-y-6 lg:col-span-4">
            {/* Live Project Card Preview */}
            <Card className="border-border/70 shadow-sm bg-card sticky top-6">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Live Card Preview</CardTitle>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    Real-time
                  </span>
                </div>
                <CardDescription className="text-[11px]">
                  Here is how this project will appear on the projects overview dashboard.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* The Preview Card replicating ProjectListView */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="truncate font-semibold text-foreground text-sm" title={formData.name || 'Untitled Project'}>
                        {formData.name.trim() || 'Untitled Project'}
                      </h3>
                      {formData.client_name && (
                        <p className="text-[11px] font-medium text-primary truncate mt-0.5">
                          {formData.client_name}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {formData.description.trim() || 'No project description added yet.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_LABELS[formData.status]?.color ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {STATUS_LABELS[formData.status]?.label ?? `Status ${formData.status}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress section */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">0%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: '0%' }} />
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">0 / 0 Tasks Completed</p>
                  </div>

                  {/* Footer with Due Date & Members */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        Due:{' '}
                        {formData.end_date
                          ? new Date(formData.end_date).toLocaleDateString()
                          : '-'}
                      </span>
                    </div>

                    <div className="flex -space-x-2">
                      {selectedManager ? (
                        <div
                          className="relative flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] font-medium text-foreground"
                          title={`PM: ${selectedManager.firstname}`}
                        >
                          {selectedManager.firstname?.charAt(0)}
                          <span className="absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <div
                          className="flex size-6 items-center justify-center rounded-full bg-muted/60 border-2 border-dashed border-border text-[9px] text-muted-foreground"
                          title="No PM assigned"
                        >
                          ?
                        </div>
                      )}

                      {selectedMembers.slice(0, 3).map((member) => (
                        <div
                          key={member.id}
                          className="flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] font-medium text-foreground"
                          title={member.firstname}
                        >
                          {member.firstname?.charAt(0)}
                        </div>
                      ))}

                      {selectedMembers.length > 3 && (
                        <div className="flex size-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[9px] font-medium text-foreground">
                          +{selectedMembers.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Details Summary Table */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-semibold text-foreground">
                      {selectedManager ? `${selectedManager.firstname} ${selectedManager.lastname || ''}` : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Team Size</span>
                    <span className="font-semibold text-foreground">
                      {formData.user_ids.length} member{formData.user_ids.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold text-foreground">
                      {durationDays > 0 ? `${durationDays} days` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Initial Status</span>
                    <span className="font-semibold text-foreground">
                      {STATUS_LABELS[formData.status]?.label || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Helpful Tips Card */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                    <Info className="size-3.5" />
                    <span>Quick Tip</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Once created, you can immediately add tasks, assign milestones, and upload project assets from the project detail page.
                  </p>
                </div>

                {/* Bottom Actions inside Sidebar */}
                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-10 gap-2 shadow-sm font-medium text-xs"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    <span>{mutation.isPending ? 'Creating Project...' : 'Create Project'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-xs"
                    onClick={onBack}
                    disabled={mutation.isPending}
                  >
                    Cancel & Return
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
