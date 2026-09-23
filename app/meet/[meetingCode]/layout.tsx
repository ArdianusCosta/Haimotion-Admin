import { ReactNode } from 'react'

export default function MeetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      <header className="h-14 border-b flex items-center px-6 bg-card shrink-0">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="size-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs leading-none">H</span>
          </div>
          HaiMotion Meet
        </div>
      </header>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  )
}
