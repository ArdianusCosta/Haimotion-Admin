'use client'

import { LayoutTemplate, PanelLeft, LayoutPanelTop, PanelLeftDashed, Check } from 'lucide-react'

type LayoutStyle = 'sidebar' | 'topnav' | 'sidebar-mini'

interface LayoutsPageProps {
  layoutStyle: LayoutStyle
  setLayoutStyle: (layout: LayoutStyle) => void
}

export function LayoutsPage({ layoutStyle, setLayoutStyle }: LayoutsPageProps) {
  const options = [
    { 
      id: 'sidebar', 
      name: 'Sidebar', 
      description: 'The standard left-aligned navigation sidebar.',
      icon: PanelLeft 
    },
    { 
      id: 'sidebar-mini', 
      name: 'Sidebar Mini', 
      description: 'A compact sidebar that only shows icons.',
      icon: PanelLeftDashed 
    },
    { 
      id: 'topnav', 
      name: 'Top Navigation', 
      description: 'Horizontal navigation in the top header.',
      icon: LayoutPanelTop 
    }
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>System</span><span>/</span><span className="text-foreground">Layouts</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Interface Layouts</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Customize the primary navigation structure of your dashboard.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setLayoutStyle(option.id as LayoutStyle)}
            className={`group relative flex flex-col items-start gap-4 rounded-xl border p-6 text-left transition-all ${
              layoutStyle === option.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/50' 
                : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            {/* Visual Indicator of the layout */}
            <div className="flex w-full justify-center rounded-lg bg-muted p-6">
              <div className="relative flex h-24 w-32 overflow-hidden rounded-md border border-border bg-background shadow-sm">
                {option.id === 'sidebar' && (
                  <>
                    <div className="w-8 border-r border-border bg-muted/50" />
                    <div className="flex-1 flex flex-col">
                      <div className="h-4 border-b border-border bg-card" />
                      <div className="flex-1 bg-background" />
                    </div>
                  </>
                )}
                {option.id === 'sidebar-mini' && (
                  <>
                    <div className="w-3 border-r border-border bg-muted/50" />
                    <div className="flex-1 flex flex-col">
                      <div className="h-4 border-b border-border bg-card" />
                      <div className="flex-1 bg-background" />
                    </div>
                  </>
                )}
                {option.id === 'topnav' && (
                  <div className="flex size-full flex-col">
                    <div className="h-5 border-b border-border bg-muted/50 flex items-center px-1">
                      <div className="h-1.5 w-6 rounded bg-muted-foreground/30" />
                      <div className="ml-2 h-1.5 w-10 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="flex-1 bg-background" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <option.icon className="size-5 text-muted-foreground" />
                {option.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
            </div>
            
            {layoutStyle === option.id && (
              <div className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Check className="size-3.5" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Live Preview Active</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          When you select a layout option above, the main application shell immediately updates to reflect your choice. This preference is applied globally across all pages in the dashboard.
        </p>
      </div>
    </div>
  )
}

export default LayoutsPage
