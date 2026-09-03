'use client'

import { useState } from 'react'
import { Check, ChevronRight, Code2, Database, Globe, LayoutTemplate, Settings2 } from 'lucide-react'

const steps = [
  { id: 1, title: 'Project Details', description: 'Name and description' },
  { id: 2, title: 'Framework', description: 'Choose your tech stack' },
  { id: 3, title: 'Database', description: 'Data storage setup' },
  { id: 4, title: 'Review', description: 'Verify and create' },
]

export function SetupProjectPage() {
  const [currentStep, setCurrentStep] = useState(1)

  // Form states
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [framework, setFramework] = useState('nextjs')
  const [database, setDatabase] = useState('postgresql')

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="mx-auto max-w-4xl pt-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Setup New Project</h1>
        <p className="text-muted-foreground mt-2">Configure your developer environment in 4 easy steps.</p>
      </div>

      {/* Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} 
          />
          
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div 
                className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                  step.id < currentStep 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : step.id === currentStep 
                      ? 'border-primary bg-background text-primary'
                      : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {step.id < currentStep ? <Check className="size-5" /> : <span className="font-semibold">{step.id}</span>}
              </div>
              <div className="text-center hidden sm:block">
                <p className={`text-sm font-medium ${step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Content */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col">
        <div className="flex-1">
          
          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold">Project Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <input 
                    type="text" 
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. Acme Admin Portal" 
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    value={projectDesc}
                    onChange={e => setProjectDesc(e.target.value)}
                    placeholder="Brief description of your project..." 
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Framework */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold">Choose Framework</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'nextjs', name: 'Next.js', icon: LayoutTemplate, desc: 'React framework for production' },
                  { id: 'react', name: 'React', icon: Code2, desc: 'A JavaScript library for building UIs' },
                  { id: 'vue', name: 'Vue.js', icon: Globe, desc: 'The Progressive JavaScript Framework' },
                  { id: 'angular', name: 'Angular', icon: Settings2, desc: 'The modern web developer\'s platform' }
                ].map(fw => (
                  <button 
                    key={fw.id}
                    onClick={() => setFramework(fw.id)}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                      framework === fw.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${framework === fw.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <fw.icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{fw.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{fw.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Database */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold">Database Setup</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'postgresql', name: 'PostgreSQL', desc: 'Powerful, open source object-relational database' },
                  { id: 'mysql', name: 'MySQL', desc: 'The world\'s most popular open source database' },
                  { id: 'mongodb', name: 'MongoDB', desc: 'Document-based, distributed database' },
                  { id: 'redis', name: 'Redis', desc: 'In-memory data structure store' }
                ].map(db => (
                  <button 
                    key={db.id}
                    onClick={() => setDatabase(db.id)}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                      database === db.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${database === db.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Database className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{db.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{db.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Review & Create</h2>
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">Ready to build</span>
              </div>
              
              <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
                  <div className="col-span-1 text-sm text-muted-foreground">Project Name</div>
                  <div className="col-span-2 text-sm font-medium">{projectName || 'Untitled Project'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
                  <div className="col-span-1 text-sm text-muted-foreground">Description</div>
                  <div className="col-span-2 text-sm font-medium">{projectDesc || 'No description provided.'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
                  <div className="col-span-1 text-sm text-muted-foreground">Framework</div>
                  <div className="col-span-2 text-sm font-medium capitalize">{framework}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm text-muted-foreground">Database</div>
                  <div className="col-span-2 text-sm font-medium capitalize">{database}</div>
                </div>
              </div>

              <div className="rounded-lg bg-primary/10 p-4 flex gap-3 items-start">
                <Settings2 className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary">Clicking create will provision a new repository, setup the selected framework and initialize the database connection strings.</p>
              </div>
            </div>
          )}
          
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
          <button 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Back
          </button>
          
          {currentStep < steps.length ? (
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue <ChevronRight className="size-4" />
            </button>
          ) : (
            <button 
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              Create Project <Check className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
