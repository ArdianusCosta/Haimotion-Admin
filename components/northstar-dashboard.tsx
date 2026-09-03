'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionPage } from '@/components/section-page'
import { ChatPage } from '@/components/chat-page'
import { AnalyticsPage } from '@/components/analytics-page'
import { OrdersPage } from '@/components/orders-page'
import { ProductsPage } from '@/components/products-page'
import { CustomersPage } from '@/components/customers-page'
import { MailPage } from '@/components/mail-page'
import { KanbanPage } from '@/components/kanban-page'
import { CalendarPage } from '@/components/calendar-page'
import { SettingsPage } from '@/components/settings-page'
import { ProjectPage } from '@/components/project-page'
import { LayoutsPage } from '@/components/layouts-page'
import { AiPage } from '@/components/ai-page'
import { TasksPage } from '@/components/tasks-page'
import { SetupProjectPage } from '@/components/setup-project-page'
import { MilestonePage } from '@/components/milestone-page'
import { ModuleFlowPage } from '@/components/module-flow-page'
import { RolesPermissionsPage } from '@/components/roles-permissions-page'
import { UsersPage } from '@/components/users-page'
import FileManager from '@/components/file-manager/file-manager'
import { useLanguage } from '@/components/language-provider'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Command, Download,
  File, FileImage, FileSpreadsheet, Folder, FolderOpen, Grid2X2, LayoutDashboard,
  List, Mail, Menu, MessageCircle, MoreHorizontal, Package, PanelLeft,
  Plus, Search, Settings, ShoppingCart, Sparkles, Sun, Users, X, Zap, ClipboardList, LayoutTemplate, Paintbrush, ListTodo, UserCheck, Blocks, Flag, GitPullRequest, ShieldAlert, ShieldCheck, LogOut
} from 'lucide-react'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Analytics', icon: Activity },
  { label: 'Orders', icon: ShoppingCart, badge: '12' }, { label: 'Products', icon: Package },
  { label: 'Customers', icon: Users },
]
const apps = [
  { label: 'Chat', icon: MessageCircle, badge: '4' }, { label: 'Mail', icon: Mail },
  { label: 'Kanban', icon: Check }, { label: 'Calendar', icon: CalendarDays },
  { label: 'Project', icon: ClipboardList }, { label: 'Tasks', icon: ListTodo },
  { label: 'AI Assistant', icon: Sparkles },
  { label: 'Layouts', icon: LayoutTemplate }
]
const developer = [
  { label: 'Setup Project', icon: Blocks },
  { label: 'Milestones', icon: Flag },
  { label: 'Module Flows', icon: GitPullRequest }
]
const administration = [
  { label: 'Roles & Permissions', icon: ShieldCheck },
  { label: 'User Management', icon: Users },
]
const products = [
  ['Aurora Headphones', '1,240 sold', '$124,820', 'bg-chart-1'],
  ['Nimbus Keyboard', '864 sold', '$86,400', 'bg-chart-2'],
  ['Orbit Desk Lamp', '622 sold', '$41,780', 'bg-chart-3'],
]
const orders = [
  ['#N-28391', 'Olivia Martin', 'Aug 31, 2026', '$248.00', 'Paid'],
  ['#N-28390', 'Liam Chen', 'Aug 31, 2026', '$1,240.00', 'Paid'],
  ['#N-28389', 'Ava Williams', 'Aug 30, 2026', '$86.00', 'Pending'],
  ['#N-28388', 'Noah Smith', 'Aug 30, 2026', '$420.00', 'Paid'],
]

function Icon({ icon: I, className = '' }: { icon: React.ElementType; className?: string }) { return <I className={className} aria-hidden="true" /> }

export default function HaiMotionDashboard({ initialSection = 'Dashboard', user }: { initialSection?: string, user?: any }) {
  const { t } = useLanguage()
  const router = useRouter()

  const [layoutStyle, setLayoutStyle] = useState<'sidebar' | 'topnav' | 'sidebar-mini'>('sidebar')
  const [collapsed, setCollapsed] = useState(false)
  const [section, setSection] = useState(initialSection)

  // Keep state in sync with URL prop changes (e.g. browser back button)
  useEffect(() => {
    setSection(initialSection)
  }, [initialSection])

  const handleNavigate = (newSection: string) => {
    setSection(newSection)
    const slug = newSection.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')
    router.push('/' + (slug === 'dashboard' ? '' : slug))
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_state')
    localStorage.removeItem('auth_user')
    window.location.reload()
  }

  const [command, setCommand] = useState(false)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [activeColor, setActiveColor] = useState('Green')
  const [activeRadius, setActiveRadius] = useState('0.5')

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system')
  const [contentWidth, setContentWidth] = useState<'centered' | 'full'>('centered')
  const [headerStyle, setHeaderStyle] = useState<'sticky' | 'scroll' | 'inset'>('sticky')
  const [sidebarStyle, setSidebarStyle] = useState<'sidebar' | 'floating' | 'icon' | 'offcanvas'>('sidebar')
  const [resolvedDark, setResolvedDark] = useState(false)

  const [range, setRange] = useState('Last 30 days')

  // --- PREFERENCES LOGIC ---
  useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const res = await fetch(`/api/user/preferences?userId=${user.id}`, { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      const pref = data.preference
      if (pref) {
        if (pref.layout_style) setLayoutStyle(pref.layout_style as any)
        if (pref.theme_color) setActiveColor(pref.theme_color)
        if (pref.theme_radius) setActiveRadius(pref.theme_radius)
        if (pref.theme_mode) setThemeMode(pref.theme_mode as any)
        if (pref.content_width) setContentWidth(pref.content_width as any)
        if (pref.header_style) setHeaderStyle(pref.header_style as any)
        if (pref.sidebar_style) setSidebarStyle(pref.sidebar_style as any)
      }
      return pref
    },
    enabled: !!user?.id
  })

  const updatePreference = useMutation({
    mutationFn: async (newPrefs: any) => {
      if (!user?.id) return
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...newPrefs })
      })
    }
  })

  const handlePrefChange = (key: string, value: string, setter: (val: any) => void) => {
    setter(value)
    updatePreference.mutate({ [key]: value })
  }
  // -------------------------

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches)
      setResolvedDark(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    }
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeMode])

  const isFiles = section === 'File Manager'

  const isTopnav = layoutStyle === 'topnav'
  const isSidebarMini = sidebarStyle === 'icon' || collapsed
  const effectiveCollapsed = isSidebarMini

  const asideClasses = `hidden transition-all duration-300 md:flex md:flex-col bg-sidebar ${sidebarStyle === 'offcanvas' ? '!hidden' : ''} ${sidebarStyle === 'floating' ? 'm-4 rounded-xl border border-sidebar-border shadow-sm h-[calc(100vh-2rem)]' : 'border-r border-sidebar-border h-screen'} ${effectiveCollapsed ? 'w-20' : 'w-64'}`
  const headerClasses = `flex shrink-0 items-center justify-between border-border bg-card/70 px-4 backdrop-blur md:px-8 z-10 ${headerStyle === 'sticky' ? 'h-16 border-b sticky top-0' : ''} ${headerStyle === 'scroll' ? 'h-16 border-b' : ''} ${headerStyle === 'inset' ? 'h-14 mx-4 mt-4 rounded-xl border sticky top-4' : ''}`

  const colorPresets: Record<string, string> = useMemo(() => ({
    Zinc: 'oklch(0.4 0.02 260)',
    Rose: 'oklch(0.55 0.2 20)',
    Blue: 'oklch(0.5 0.15 250)',
    Green: 'oklch(0.52 0.16 155)',
    Orange: 'oklch(0.65 0.18 50)'
  }), [])

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', colorPresets[activeColor]);
    document.documentElement.style.setProperty('--radius', `${activeRadius}rem`);
  }, [activeColor, activeRadius, colorPresets])

  return <div
    className={resolvedDark ? 'dark h-screen bg-background overflow-hidden' : 'h-screen bg-background overflow-hidden'}
    style={{
      '--primary': colorPresets[activeColor],
      '--radius': `${activeRadius}rem`
    } as React.CSSProperties}
  >
    <div className="flex h-screen overflow-hidden text-foreground">
      {!isTopnav && (
        <aside className={asideClasses}>
          <div className={`flex items-center gap-3 border-b border-sidebar-border px-5 ${sidebarStyle === 'floating' ? 'h-14' : 'h-16'}`}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></div>
            {!effectiveCollapsed && <span className="font-semibold tracking-tight">HaiMotion</span>}
          </div>
          <div className="flex flex-1 flex-col gap-7 px-3 py-6 overflow-y-auto">
            <div className="flex flex-col gap-1"><p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${effectiveCollapsed ? 'sr-only' : ''}`}>{t('Workspace')}</p>
              {nav.map(({ label, icon, badge }) => <button key={label} onClick={() => handleNavigate(label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${section === label ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}><Icon icon={icon} className="size-4 shrink-0" />{!effectiveCollapsed && <><span className="flex-1 text-left">{t(label)}</span>{badge && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{badge}</span>}</>}</button>)}
            </div>
            <div className="flex flex-col gap-1"><p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${effectiveCollapsed ? 'sr-only' : ''}`}>{t('Apps')}</p>
              {apps.map(({ label, icon, badge }) => <button key={label} onClick={() => handleNavigate(label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${section === label ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}><Icon icon={icon} className="size-4 shrink-0" />{!effectiveCollapsed && <><span className="flex-1 text-left">{t(label)}</span>{badge && <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">{badge}</span>}</>}</button>)}
            </div>
            <div className="flex flex-col gap-1"><p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${effectiveCollapsed ? 'sr-only' : ''}`}>{t('Developer')}</p>
              {developer.map(({ label, icon }) => <button key={label} onClick={() => handleNavigate(label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${section === label ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}><Icon icon={icon} className="size-4 shrink-0" />{!effectiveCollapsed && <span className="flex-1 text-left">{t(label)}</span>}</button>)}
            </div>
            <div className="flex flex-col gap-1"><p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground ${effectiveCollapsed ? 'sr-only' : ''}`}>{t('Administration')}</p>
              {administration.map(({ label, icon }) => <button key={label} onClick={() => handleNavigate(label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${section === label ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}><Icon icon={icon} className="size-4 shrink-0" />{!effectiveCollapsed && <span className="flex-1 text-left">{t(label)}</span>}</button>)}
            </div>
            <div className="flex flex-col gap-1"><button onClick={() => handleNavigate('File Manager')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${isFiles ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}><FolderOpen className="size-4 shrink-0" />{!effectiveCollapsed && <span>{t('File Manager')}</span>}</button><button onClick={() => handleNavigate('Settings')} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${section === 'Settings' ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}`}><Settings className="size-4 shrink-0" />{!effectiveCollapsed && <span>{t('Settings')}</span>}</button></div>
          </div>
          <div className="border-t border-sidebar-border p-3">
            <div className="flex flex-col gap-1">
              <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent">
                <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {user?.firstname ? (user.firstname[0] + (user.lastname?.[0] || '')).toUpperCase() : 'A'}
                </div>
                {!effectiveCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user?.firstname ? `${user.firstname} ${user.lastname || ''}` : 'Admin'}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email || 'Admin account'}</p>
                  </div>
                )}
              </button>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-red-500 hover:bg-red-500/10">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full"><LogOut className="size-4" /></div>
                {!effectiveCollapsed && <span className="text-sm font-medium">Log out</span>}
              </button>
            </div>
          </div>
        </aside>
      )}
      <main className="min-w-0 flex-1 h-screen overflow-y-auto relative">
        <header className={headerClasses}>
          <div className="flex items-center gap-3">
            {!isTopnav && <button className="rounded-lg p-2 hover:bg-muted md:hidden" aria-label="Open menu"><Menu className="size-5" /></button>}
            {!isTopnav && <button onClick={() => setCollapsed(!collapsed)} className="hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:block" aria-label="Toggle sidebar"><PanelLeft className="size-4" /></button>}
            {isTopnav && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 font-semibold tracking-tight"><div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></div><span className="hidden lg:inline">HaiMotion</span></div>
                <div className="hidden md:flex items-center gap-1 overflow-x-auto">
                  {[...nav, ...apps, ...developer, ...administration].map(({ label, icon }) => (
                    <button key={label} onClick={() => handleNavigate(label)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${section === label ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon icon={icon} className="size-4 shrink-0" />{t(label)}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="hidden h-5 w-px bg-border md:block" />
            <button onClick={() => setCommand(true)} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><Search className="size-4" /><span className="hidden sm:inline">{t('Search anything')}</span><kbd className="ml-3 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘ K</kbd></button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCustomizerOpen(true)} className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Preferences"><Settings className="size-4" /></button>
            <button onClick={() => setThemeMode(resolvedDark ? 'light' : 'dark')} className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Toggle theme"><Sun className="size-4" /></button>
            <button className="relative rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" /></button>
            <div className="mx-2 hidden h-5 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {user?.firstname ? (user.firstname[0] + (user.lastname?.[0] || '')).toUpperCase() : 'A'}
              </div>
              {/* <button onClick={handleLogout} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10" aria-label="Log out">
                <LogOut className="size-4" />
              </button> */}
            </div>
          </div>
        </header>
        <div className={`mx-auto p-4 md:p-8 ${contentWidth === 'centered' ? 'max-w-[1500px]' : 'w-full max-w-none'}`}>
          {isFiles ? <FileManager user={user} /> : (() => {
            switch (section) {
              case 'Dashboard': return <Dashboard range={range} setRange={setRange} section={section} user={user} />
              case 'Chat': return <ChatPage />
              case 'Analytics': return <AnalyticsPage />
              case 'Orders': return <OrdersPage />
              case 'Products': return <ProductsPage />
              case 'Customers': return <CustomersPage />
              case 'Mail': return <MailPage />
              case 'Kanban': return <KanbanPage />
              case 'Calendar': return <CalendarPage />
              case 'Settings': return <SettingsPage />
              case 'Project': return <ProjectPage />
              case 'Tasks': return <TasksPage />
              case 'AI Assistant': return <AiPage />
              case 'Layouts': return <LayoutsPage layoutStyle={layoutStyle} setLayoutStyle={(val) => handlePrefChange('layout_style', val, setLayoutStyle)} />
              case 'Setup Project': return <SetupProjectPage />
              case 'Milestones': return <MilestonePage />
              case 'Module Flows': return <ModuleFlowPage />
              case 'Roles & Permissions': return <RolesPermissionsPage />
              case 'User Management': return <UsersPage />
              default: return <SectionPage section={section} />
            }
          })()}
        </div>
      </main>
    </div>
    {command && <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[15vh]" onClick={() => setCommand(false)}><div className="w-full max-w-xl rounded-2xl border border-border bg-popover p-2 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center gap-3 border-b border-border px-3 py-3"><Search className="size-4 text-muted-foreground" /><input autoFocus placeholder="Search pages, orders, customers..." className="flex-1 bg-transparent text-sm outline-none" /><kbd className="text-xs text-muted-foreground">ESC</kbd></div><div className="flex flex-col gap-1 p-2"><button onClick={() => { setSection('Dashboard'); setCommand(false) }} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted"><LayoutDashboard className="size-4" />Go to Dashboard</button><button onClick={() => { setSection('File Manager'); setCommand(false) }} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted"><Folder className="size-4" />Open File Manager</button></div></div></div>}

    {customizerOpen && (
      <div className="fixed inset-0 z-50 flex justify-end bg-transparent" onClick={() => setCustomizerOpen(false)}>
        <div className="w-[360px] bg-background border-l border-border p-6 shadow-2xl h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
              <p className="text-xs text-muted-foreground">Customize your dashboard layout preferences.</p>
            </div>
            <button onClick={() => setCustomizerOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-sm font-medium mb-3">Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {['light', 'dark', 'system'].map(t => (
                  <button key={t} onClick={() => handlePrefChange('theme_mode', t, setThemeMode)} className={`flex items-center justify-center rounded-md border py-2 text-xs font-medium capitalize transition-colors ${themeMode === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted hover:border-primary/50'}`}>{t}</button>
                ))}
              </div>
            </div>
            {!isTopnav && (
              <div>
                <h3 className="text-sm font-medium mb-3">Sidebar</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['sidebar', 'floating', 'icon', 'offcanvas'].map(s => (
                    <button key={s} onClick={() => handlePrefChange('sidebar_style', s, setSidebarStyle)} className={`flex items-center justify-center rounded-md border py-2 text-xs font-medium capitalize transition-colors ${sidebarStyle === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted hover:border-primary/50'}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium mb-3">Header</h3>
              <div className="grid grid-cols-3 gap-2">
                {['sticky', 'scroll', 'inset'].map(h => (
                  <button key={h} onClick={() => handlePrefChange('header_style', h, setHeaderStyle)} className={`flex items-center justify-center rounded-md border py-2 text-xs font-medium capitalize transition-colors ${headerStyle === h ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted hover:border-primary/50'}`}>{h}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Content Width</h3>
              <div className="grid grid-cols-2 gap-2">
                {['centered', 'full'].map(w => (
                  <button key={w} onClick={() => handlePrefChange('content_width', w, setContentWidth)} className={`flex items-center justify-center rounded-md border py-2 text-xs font-medium capitalize transition-colors ${contentWidth === w ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted hover:border-primary/50'}`}>{w}</button>
                ))}
              </div>
            </div>
            <hr className="border-border" />
            <div>
              <h3 className="text-sm font-medium mb-3">Color Preset</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(colorPresets).map(color => (
                  <button key={color} onClick={() => handlePrefChange('theme_color', color, setActiveColor)} className={`flex items-center justify-center rounded-md border py-2 text-xs font-medium transition-colors ${activeColor === color ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted hover:border-primary/50'}`}>
                    <span className="mr-2 flex size-3 items-center justify-center rounded-full" style={{ backgroundColor: colorPresets[color] }} />{color}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Radius</h3>
              <div className="grid grid-cols-5 gap-2">
                {['0', '0.3', '0.5', '0.75', '1.0'].map(rad => (
                  <button key={rad} onClick={() => handlePrefChange('theme_radius', rad, setActiveRadius)} className={`flex items-center justify-center rounded-md border py-2 text-xs font-medium transition-colors ${activeRadius === rad ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted hover:border-primary/50'}`}>{rad}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
}

function Dashboard({ range, setRange, section, user }: { range: string; setRange: (v: string) => void; section: string; user?: any }) {
  const [greeting, setGreeting] = useState("Here's what's happening with your business today.")
  const [timeGreeting, setTimeGreeting] = useState("Good morning")

  useEffect(() => {
    const quotes = [
      "Here's what's happening with your business today.",
      "Great things never come from comfort zones.",
      "Dream it. Wish it. Do it.",
      "Success doesn't just find you. You have to go out and get it.",
      "The harder you work for something, the greater you'll feel when you achieve it.",
      "Dream bigger. Do bigger.",
      "Don't stop when you're tired. Stop when you're done.",
      "Wake up with determination. Go to bed with satisfaction.",
      "Do something today that your future self will thank you for.",
      "Little things make big days.",
      "It's going to be hard, but hard does not mean impossible.",
      "Don't wait for opportunity. Create it.",
      "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
      "The key to success is to focus on goals, not obstacles.",
      "Dream it. Believe it. Build it.",
    ]
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
    setGreeting(quotes[dayOfYear % quotes.length])

    const hour = new Date().getHours()
    if (hour < 12) setTimeGreeting("Good morning")
    else if (hour < 18) setTimeGreeting("Good afternoon")
    else setTimeGreeting("Good evening")
  }, [])

  return <><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span>Workspace</span><ChevronRight className="size-3" /><span className="text-foreground">{section}</span></div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{timeGreeting}, {user?.firstname || 'Admin'}</h1><p className="mt-1 text-sm text-muted-foreground">{greeting}</p></div><div className="flex items-center gap-2"><button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"><Download className="size-4" />Export</button><select value={range} onChange={e => setRange(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"><option>Last 30 days</option><option>Last 7 days</option><option>This year</option></select></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Total Revenue', '$284,920', '+18.2%', ArrowUpRight, 'vs. last month'], ['Orders', '1,429', '+12.5%', ArrowUpRight, 'vs. last month'], ['Avg. order value', '$199.24', '+4.8%', ArrowUpRight, 'vs. last month'], ['Conversion rate', '4.82%', '-0.6%', ArrowDownRight, 'vs. last month']].map(([label, value, change, Arrow, sub]) => <div key={label as string} className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label as string}</span><span className="flex size-8 items-center justify-center rounded-lg bg-muted"><Activity className="size-4 text-muted-foreground" /></span></div><p className="mt-4 text-2xl font-semibold tracking-tight">{value as string}</p><p className="mt-1 flex items-center gap-1 text-xs"><Arrow className="size-3 text-primary" /><span className="font-medium text-primary">{change as string}</span><span className="text-muted-foreground">{sub as string}</span></p></div>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]"><RevenueChart /><TrafficCard /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]"><ActivityCard /><GoalsCard /><TopProducts /></div><OrdersTable /></>
}

function RevenueChart() { const bars = [32, 45, 38, 52, 48, 63, 57, 71, 68, 78, 73, 86, 80, 92, 88, 96, 84, 94, 89, 100, 91, 97, 86, 93, 90, 98, 94, 100, 96, 100]; return <section className="rounded-xl border border-border bg-card p-5 md:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Revenue overview</h2><p className="mt-1 text-xs text-muted-foreground">Monthly revenue performance</p></div><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="More revenue options"><MoreHorizontal className="size-4" /></button></div><div className="mt-6 flex items-end gap-1.5 sm:gap-2" style={{ height: 220 }}>{bars.map((height, i) => <div key={i} className="group flex flex-1 flex-col justify-end"><div className="w-full rounded-t-sm bg-primary/80 transition-all group-hover:bg-primary" style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>Aug 1</span><span>Aug 8</span><span>Aug 15</span><span>Aug 22</span><span>Aug 31</span></div></section> }
function TrafficCard() { return <section className="rounded-xl border border-border bg-card p-5 md:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Traffic sources</h2><p className="mt-1 text-xs text-muted-foreground">Where your visitors come from</p></div><button className="text-xs font-medium text-primary hover:underline">View report</button></div><div className="mt-7 flex items-center gap-6"><div className="relative flex size-36 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(var(--primary) 0 42%, var(--chart-2) 42% 69%, var(--chart-3) 69% 84%, var(--muted) 84% 100%)' }}><div className="flex size-24 items-center justify-center rounded-full bg-card"><div className="text-center"><p className="text-xl font-semibold">24.8k</p><p className="text-[10px] text-muted-foreground">visitors</p></div></div></div><div className="flex flex-col gap-3 text-xs">{[['Direct', '42%', 'bg-primary'], ['Organic search', '27%', 'bg-chart-2'], ['Social media', '15%', 'bg-chart-3'], ['Other', '16%', 'bg-muted']].map(([name, val, color]) => <div key={name} className="flex items-center gap-2"><span className={`size-2 rounded-full ${color}`} /><span className="text-muted-foreground">{name}</span><span className="ml-auto font-medium">{val}</span></div>)}</div></div></section> }
function ActivityCard() { return <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent activity</h2><button className="text-xs font-medium text-primary">View all</button></div><div className="mt-5 flex flex-col gap-5">{[['Olivia Martin', 'placed a new order', '2 min ago', 'bg-primary'], ['Liam Chen', 'completed payment', '18 min ago', 'bg-chart-2'], ['Ava Williams', 'signed up for newsletter', '1 hr ago', 'bg-chart-3'], ['Noah Smith', 'left a product review', '3 hrs ago', 'bg-muted']].map(([name, action, time, color]) => <div className="flex gap-3" key={name}><div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground ${color}`}>{(name as string).split(' ').map(n => n[0]).join('')}</div><div className="min-w-0 text-xs"><p><span className="font-medium">{name}</span> <span className="text-muted-foreground">{action}</span></p><p className="mt-1 text-muted-foreground">{time}</p></div></div>)}</div></section> }
function GoalsCard() { return <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Monthly goals</h2><p className="mt-1 text-xs text-muted-foreground">Keep the momentum going</p><div className="mt-6 flex flex-col gap-5">{[['Revenue target', '$350k', '$284.9k', 81], ['New customers', '1,500', '1,124', 75], ['Orders fulfilled', '2,000', '1,429', 71]].map(([label, target, current, percent]) => <div key={label as string}><div className="mb-2 flex justify-between text-xs"><span className="font-medium">{label as string}</span><span className="text-muted-foreground">{current as string} <span className="text-border">/</span> {target as string}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div></div>)}</div></section> }
function TopProducts() { return <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Top products</h2><button className="text-xs font-medium text-primary">View all</button></div><div className="mt-5 flex flex-col gap-4">{products.map(([name, sold, revenue, color], i) => <div key={name} className="flex items-center gap-3"><div className={`flex size-9 items-center justify-center rounded-lg ${color}`}><Package className="size-4 text-primary-foreground" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{sold}</p></div><p className="text-xs font-medium">{revenue}</p></div>)}</div></section> }
function OrdersTable() { return <section className="mt-6 rounded-xl border border-border bg-card"><div className="flex items-center justify-between p-5"><div><h2 className="font-semibold">Recent orders</h2><p className="mt-1 text-xs text-muted-foreground">Your latest transactions</p></div><button className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted">View all orders</button></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-y border-border bg-muted/40 text-muted-foreground"><tr>{['Order', 'Customer', 'Date', 'Amount', 'Status'].map(h => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{orders.map(([id, customer, date, amount, status]) => <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/30"><td className="px-5 py-4 font-medium">{id}</td><td className="px-5 py-4">{customer}</td><td className="px-5 py-4 text-muted-foreground">{date}</td><td className="px-5 py-4 font-medium">{amount}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{status}</span></td></tr>)}</tbody></table></div></section> }
