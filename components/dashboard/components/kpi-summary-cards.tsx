'use client'

import { useRouter } from 'next/navigation'
import { Users, FolderKanban, CheckSquare } from 'lucide-react'

interface KpiSummaryCardsProps {
  data: any
}

export function KpiSummaryCards({ data }: KpiSummaryCardsProps) {
  const router = useRouter()
  const { kpis } = data

  const totalUsers = kpis?.totalUsers?.value ?? 0
  const totalProjects = kpis?.totalProjects?.value ?? 0
  const totalTasks = kpis?.totalTasks?.value ?? 0

  const primaryCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      link: '/users'
    },
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: FolderKanban,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      link: '/projects'
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: CheckSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      link: '/tasks'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {primaryCards.map((card, idx) => (
        <div
          key={idx}
          onClick={() => router.push(card.link)}
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
              {card.value.toLocaleString()}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              {card.title}
            </p>
          </div>
          <div className={`size-14 rounded-2xl flex items-center justify-center ${card.bgColor} ${card.color} border ${card.borderColor} shadow-inner transition-transform group-hover:scale-110 duration-200`}>
            <card.icon className="size-7" />
          </div>
        </div>
      ))}
    </div>
  )
}
