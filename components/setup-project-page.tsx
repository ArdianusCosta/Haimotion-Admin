'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, LayoutTemplate, ArrowLeft, Plus, Settings2, Trash2, Edit2, GripVertical, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Main Router Component
export function SetupProjectPage({ slug, user }: { slug?: string[], user?: any }) {
  const projectId = slug && slug.length > 1 ? slug[1] : null;

  if (projectId) {
    const canEditSetup = user?.role?.name === 'Administrator' || user?.role?.permissions?.some((p: any) => p.permission === 'projects.update');
    
    if (canEditSetup) {
      return <SetupProjectWorkflow projectId={projectId} user={user} />
    } else {
      return <SetupProjectWizard projectId={projectId} />
    }
  }

  return <SetupProjectList user={user} />
}

// ---------------------------------------------------------
// LEVEL 1: Project List
// ---------------------------------------------------------
function SetupProjectList({ user }: { user?: any }) {
  const router = useRouter();
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['setup-projects'],
    queryFn: async () => {
      const res = await fetch('/api/setup-project')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    }
  });

  return (
    <div className="mx-auto w-full pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Setup Projects</h1>
        <p className="text-muted-foreground mt-2">Manage the setup workflow and progress for all active projects.</p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {projects?.map((project: any) => (
            <div 
              key={project.id} 
              onClick={() => router.push(`/setup-project/${project.id}`)}
              className="group cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-tight">{project.name}</h3>
              <p className="mb-6 text-sm text-muted-foreground line-clamp-2">
                {project.description || 'No description provided.'}
              </p>
              
              <div className="mb-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{project.total_steps} Steps • {project.total_fields} Fields</span>
                <span className="text-primary">{project.progress}%</span>
              </div>
              
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-500" 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
            </div>
          ))}
          
          {projects?.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No projects found. Create a project in the Projects module first.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------
// LEVEL 2 & 3: Project Workflow (Steps & Fields)
// ---------------------------------------------------------
function SetupProjectWorkflow({ projectId, user }: { projectId: string, user?: any }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Modal states
  const [stepModal, setStepModal] = useState({ open: false, name: '', desc: '' });
  const [fieldModal, setFieldModal] = useState({ open: false, stepId: 0, name: '', desc: '' });

  const { data: project, isLoading } = useQuery({
    queryKey: ['setup-project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/setup-project/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch project setup')
      return res.json()
    }
  });

  const steps = project?.setup_steps || [];
  const currentStep = steps[currentStepIndex];
  
  const canEditSetup = user?.role?.name === 'Administrator' || user?.role?.permissions?.some((p: any) => p.permission === 'projects.update');

  // Check if current step's required fields are complete
  const canContinue = currentStep?.fields?.filter((f: any) => f.is_required).every((f: any) => 
    f.values?.some((v: any) => v.is_completed)
  ) ?? true;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Field Toggle Mutation
  const toggleFieldMutation = useMutation({
    mutationFn: async ({ fieldId, isCompleted }: { fieldId: number, isCompleted: boolean }) => {
      const res = await fetch(`/api/setup-project/fields/${fieldId}/value`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update field');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['setup-projects'] });
    },
    onError: (error) => {
      toast.error(`Failed to check field: ${error.message}`);
    }
  });

  // Admin Add Step Mutation
  const addStepMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string, description: string }) => {
      const res = await fetch(`/api/setup-project/${projectId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (!res.ok) throw new Error('Failed to add step');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-project', projectId] });
      setStepModal({ open: false, name: '', desc: '' });
    }
  });

  // Admin Add Field Mutation
  const addFieldMutation = useMutation({
    mutationFn: async ({ stepId, name, description }: { stepId: number, name: string, description: string }) => {
      const res = await fetch(`/api/setup-project/steps/${stepId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (!res.ok) throw new Error('Failed to add field');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-project', projectId] });
      setFieldModal({ open: false, stepId: 0, name: '', desc: '' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="mx-auto w-full max-w-7xl pt-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/setup-project')}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Setup Workflow Configuration</p>
          </div>
        </div>
        
        {/* Admin Control */}
        {canEditSetup && (
          <button 
            onClick={() => setStepModal({ open: true, name: '', desc: '' })}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" /> Add Step
          </button>
        )}
      </div>

      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No steps configured yet.</p>
        </div>
      ) : (
        <>
          {/* Stepper Header */}
          <div className="mb-10 overflow-x-auto pb-4">
            <div className="flex min-w-max items-center justify-between relative px-6">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[calc(100%-3rem)] h-0.5 bg-border -z-10" />
              <div 
                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300" 
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} 
              />
              
              {steps.map((step: any, idx: number) => (
                <div 
                  key={step.id} 
                  className="flex flex-col items-center gap-2 bg-background px-4 cursor-pointer"
                  onClick={() => setCurrentStepIndex(idx)}
                >
                  <div 
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      step.isCompleted
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : idx === currentStepIndex 
                          ? 'border-primary bg-background text-primary'
                          : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    {step.isCompleted ? <Check className="h-5 w-5" /> : <span className="font-semibold">{idx + 1}</span>}
                  </div>
                  <div className="text-center w-24">
                    <p className={`text-xs font-medium truncate ${idx <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </p>
                    <p className="text-[10px] text-primary">{step.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          {currentStep && (
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col">
              <div className="flex-1 space-y-6">
                
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{currentStep.name}</h2>
                    {currentStep.description && <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>}
                  </div>
                  {canEditSetup && (
                    <button 
                      onClick={() => setFieldModal({ open: true, stepId: currentStep.id, name: '', desc: '' })}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Field
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {currentStep.fields?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">No fields added to this step yet.</p>
                  ) : (
                    currentStep.fields?.map((field: any) => {
                      const isCompleted = field.values?.some((v: any) => v.is_completed) ?? false;
                      
                      return (
                        <div key={field.id} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                          <label className="flex flex-1 items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isCompleted}
                              onChange={(e) => toggleFieldMutation.mutate({ fieldId: field.id, isCompleted: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {field.name}
                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                              </span>
                              {field.description && (
                                <span className="text-xs text-muted-foreground">{field.description}</span>
                              )}
                            </div>
                          </label>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Wizard Footer Controls */}
              <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                <button 
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Back
                </button>
                
                {currentStepIndex < steps.length - 1 ? (
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => router.push('/setup-project')}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Complete Setup <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Step Modal */}
      {stepModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add Step</h3>
              <button onClick={() => setStepModal(prev => ({ ...prev, open: false }))} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Step Name</label>
                <input
                  type="text"
                  value={stepModal.name}
                  onChange={e => setStepModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Installation"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description (Optional)</label>
                <textarea
                  value={stepModal.desc}
                  onChange={e => setStepModal(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="Describe this step"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setStepModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => addStepMutation.mutate({ name: stepModal.name, description: stepModal.desc })} 
                disabled={!stepModal.name.trim() || addStepMutation.isPending} 
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addStepMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                Add Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {fieldModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Add Field (Checklist Item)</h3>
              <button onClick={() => setFieldModal(prev => ({ ...prev, open: false }))} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Field Name</label>
                <input
                  type="text"
                  value={fieldModal.name}
                  onChange={e => setFieldModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Install Node.js"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description (Optional)</label>
                <textarea
                  value={fieldModal.desc}
                  onChange={e => setFieldModal(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="Add details about this task"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setFieldModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => addFieldMutation.mutate({ stepId: fieldModal.stepId, name: fieldModal.name, description: fieldModal.desc })} 
                disabled={!fieldModal.name.trim() || addFieldMutation.isPending} 
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addFieldMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={fieldModal.open} onOpenChange={(open) => setFieldModal(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Field (Checklist Item)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Field Name</label>
              <input
                type="text"
                value={fieldModal.name}
                onChange={e => setFieldModal(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Install Node.js"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (Optional)</label>
              <textarea
                value={fieldModal.desc}
                onChange={e => setFieldModal(prev => ({ ...prev, desc: e.target.value }))}
                placeholder="Add details about this task"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setFieldModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button 
              onClick={() => addFieldMutation.mutate({ stepId: fieldModal.stepId, name: fieldModal.name, description: fieldModal.desc })} 
              disabled={!fieldModal.name.trim() || addFieldMutation.isPending}
            >
              {addFieldMutation.isPending && <Loader2 className="size-3 animate-spin mr-2" />}
              Add Field
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}

// ---------------------------------------------------------
// LEVEL 2 & 3: Project Wizard (For Developers / Non-Admins)
// ---------------------------------------------------------
function SetupProjectWizard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showNotMemberModal, setShowNotMemberModal] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['setup-project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/setup-project/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch project setup')
      return res.json()
    }
  });

  const steps = project?.setup_steps || [];
  const currentStep = steps[currentStepIndex];
  
  // Check if current step's required fields are complete
  const canContinue = currentStep?.fields?.filter((f: any) => f.is_required).every((f: any) => 
    f.values?.some((v: any) => v.is_completed)
  ) ?? true;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const toggleFieldMutation = useMutation({
    mutationFn: async ({ fieldId, isCompleted }: { fieldId: number, isCompleted: boolean }) => {
      const res = await fetch(`/api/setup-project/fields/${fieldId}/value`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update field');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['setup-projects'] });
    },
    onError: (error) => {
      if (error.message === 'Not a member') {
        setShowNotMemberModal(true);
      } else {
        toast.error(`Failed to check field: ${error.message}`);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="mx-auto w-full max-w-4xl pt-6">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/setup-project')}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground absolute left-8 top-24"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Setup {project.name}</h1>
        </div>
        <p className="text-muted-foreground mt-2">Configure your developer environment in {steps.length} easy steps.</p>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No steps configured yet.</p>
        </div>
      ) : (
        <>
          {/* Wizard Stepper */}
          <div className="mb-10 px-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 -z-10 transition-all duration-300" 
                style={{ width: `${(currentStepIndex / (Math.max(steps.length - 1, 1))) * 100}%` }} 
              />
              
              {steps.map((step: any, idx: number) => (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-4">
                  <div 
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      idx < currentStepIndex
                        ? 'border-blue-500 bg-blue-500 text-white' 
                        : idx === currentStepIndex 
                          ? 'border-blue-500 bg-background text-blue-500'
                          : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    {idx < currentStepIndex ? <Check className="h-5 w-5" /> : <span className="font-semibold">{idx + 1}</span>}
                  </div>
                  <div className="text-center w-24 mt-2">
                    <p className={`text-sm font-semibold truncate ${idx <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.description || 'Action required'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          {currentStep && (
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm min-h-[350px] flex flex-col mx-12">
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-xl font-bold">{currentStep.name}</h2>
                </div>

                <div className="space-y-4 mt-6">
                  {currentStep.fields?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">No fields added to this step yet.</p>
                  ) : (
                    currentStep.fields?.map((field: any) => {
                      const isCompleted = field.values?.some((v: any) => v.is_completed) ?? false;
                      
                      return (
                        <div key={field.id} className="group">
                          <div className="text-sm font-medium mb-1.5 block">
                            {field.name}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <label className={`flex items-center gap-3 rounded-lg border p-4 transition-colors cursor-pointer ${isCompleted ? 'bg-blue-500/10 border-blue-500/30' : 'bg-background border-border hover:border-primary/50'}`}>
                            <input 
                              type="checkbox" 
                              checked={isCompleted}
                              onChange={(e) => toggleFieldMutation.mutate({ fieldId: field.id, isCompleted: e.target.checked })}
                              className="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              {field.description ? (
                                <span className={`text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{field.description}</span>
                              ) : (
                                <span className={`text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>Mark this field as complete</span>
                              )}
                            </div>
                          </label>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Wizard Footer Controls */}
              <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                <button 
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-0 transition-colors"
                >
                  Back
                </button>
                
                {currentStepIndex < steps.length - 1 ? (
                  <button 
                    onClick={handleNext}
                    disabled={!canContinue}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => router.push('/setup-project')}
                    disabled={!canContinue}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Complete <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={showNotMemberModal} onOpenChange={setShowNotMemberModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Akses Ditolak</DialogTitle>
            <DialogDescription className="pt-2">
              Maaf, Anda tidak dapat mengubah status pekerjaan ini karena Anda <strong>bukan anggota (member)</strong> dari project ini. Hanya anggota project dan Administrator yang memiliki hak akses untuk memperbarui status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowNotMemberModal(false)} variant="default">
              Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
