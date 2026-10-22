'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/authorization'

/**
 * Task Status Map (matches types/tasks.ts)
 * 0 = Pending, 1 = To Do, 2 = In Progress, 3 = In Review
 * 4 = Revisions, 5 = Done, 6 = Started, 7 = Hold, 8 = Overdue
 */
const TASK_STATUS_DONE = 5
const TASK_STATUS_OVERDUE = 8
// "Active" statuses = anything not Done and not Hold/Pending
const TASK_STATUS_ACTIVE = [1, 2, 3, 4, 6] // To Do, In Progress, In Review, Revisions, Started

export interface MemberKpi {
  id: number
  name: string
  avatar: string
  totalAssigned: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  projectCount: number
  onTimeCount: number
  performanceScore: number
  rank: number
}

export interface ProjectKpiDetail {
  id: number
  name: string
  client: string
  status: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  memberContributions: {
    userId: number
    name: string
    avatar: string
    assigned: number
    completed: number
  }[]
}

export interface KpiPerformanceData {
  periodLabel: string
  globalKpi: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
  }
  memberKpis: MemberKpi[]
  projectBreakdowns: ProjectKpiDetail[]
  allUsers: { id: number; name: string }[]
  allProjects: { id: number; name: string }[]
}

function buildPeriodDates(dateRangeStr: string): { startDate: Date; endDate: Date; label: string } {
  const now = new Date()
  let startDate: Date
  let label: string

  switch (dateRangeStr) {
    case 'Today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      label = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      break
    case 'Last 7 days':
      startDate = new Date(now); startDate.setDate(now.getDate() - 7)
      label = '7 Hari Terakhir'
      break
    case 'Last 30 days':
      startDate = new Date(now); startDate.setDate(now.getDate() - 30)
      label = '30 Hari Terakhir'
      break
    case 'Last 3 months':
      startDate = new Date(now); startDate.setMonth(now.getMonth() - 3)
      label = '3 Bulan Terakhir'
      break
    case 'This year':
      startDate = new Date(now.getFullYear(), 0, 1)
      label = `Tahun ${now.getFullYear()}`
      break
    default: // Last 6 months
      startDate = new Date(now); startDate.setMonth(now.getMonth() - 6)
      label = '6 Bulan Terakhir'
  }

  return { startDate, endDate: now, label }
}

/**
 * Performance Score Formula (documented for transparency):
 *
 * Score = (completionRate × 0.50) + (workloadScore × 0.30) + (timelinessScore × 0.20)
 *
 * - completionRate   = (completed / totalAssigned) × 100  [0–100]
 * - workloadScore    = min(totalAssigned / 10, 1) × 100   [10+ tasks = full score; proportional below]
 * - timelinessScore  = (onTimeCount / completed) × 100    [among completed: how many were on-time]
 *                      = 100 if no tasks completed (no penalty until tasks are completed)
 *
 * Tie-break order: performanceScore DESC → completionRate DESC → onTimeCount DESC → totalAssigned DESC → name ASC
 */
function computePerformanceScore(totalAssigned: number, completed: number, onTimeCount: number): number {
  if (totalAssigned === 0) return 0
  const completionRate = (completed / totalAssigned) * 100
  const workloadScore = Math.min(totalAssigned / 10, 1) * 100
  const timelinessScore = completed > 0 ? (onTimeCount / completed) * 100 : 100
  const score = (completionRate * 0.50) + (workloadScore * 0.30) + (timelinessScore * 0.20)
  return Math.round(score * 10) / 10
}

export async function getKpiPerformanceData(
  dateRangeStr: string,
  projectFilter?: string,
  memberFilter?: string
): Promise<KpiPerformanceData> {
  await requireAuth()

  const { startDate, endDate, label } = buildPeriodDates(dateRangeStr)
  const now = new Date()

  const projectIdFilter = projectFilter && projectFilter !== 'Semua Project'
    ? parseInt(projectFilter)
    : null

  const memberIdFilter = memberFilter && memberFilter !== 'Semua Anggota'
    ? parseInt(memberFilter)
    : null

  // ─── 1. Fetch tasks within period ───────────────────────────────────────────
  const taskWhere: any = {
    date_created: { gte: startDate, lte: endDate }
  }
  if (projectIdFilter) taskWhere.project_id = projectIdFilter

  const tasks = await prisma.task_list.findMany({
    where: taskWhere,
    select: {
      id: true,
      status: true,
      end_date: true,
      project_id: true,
      date_created: true,
      date_updated: true,
    }
  })

  const taskIds = tasks.map(t => t.id)

  // ─── 2. Fetch assignees for those tasks ─────────────────────────────────────
  const assigneeWhere: any = { task_id: { in: taskIds } }
  if (memberIdFilter) assigneeWhere.user_id = memberIdFilter

  const assignees = await prisma.taskAssignee.findMany({
    where: assigneeWhere,
    select: { task_id: true, user_id: true }
  })

  // ─── 3. Fetch all active users ──────────────────────────────────────────────
  const users = await prisma.user.findMany({
    where: { status: { not: 'resign' } },
    select: { id: true, firstname: true, lastname: true, avatar: true },
    orderBy: { firstname: 'asc' }
  })

  // ─── 4. Fetch projects ──────────────────────────────────────────────────────
  const projectWhere: any = { is_archived: false }
  if (projectIdFilter) projectWhere.id = projectIdFilter

  const projects = await prisma.project_list.findMany({
    where: projectWhere,
    select: { id: true, name: true, client_name: true, status: true },
    orderBy: { name: 'asc' }
  })

  // ─── 5. Build lookup maps ───────────────────────────────────────────────────
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  const userMap = new Map(users.map(u => [u.id, u]))

  // assigneesByUser: userId -> Set<taskId>
  const assigneesByUser = new Map<number, Set<number>>()
  // assigneesByTask: taskId -> userId[]
  const assigneesByTask = new Map<number, number[]>()

  for (const a of assignees) {
    // By user
    const byUser = assigneesByUser.get(a.user_id) || new Set<number>()
    byUser.add(a.task_id)
    assigneesByUser.set(a.user_id, byUser)

    // By task
    const byTask = assigneesByTask.get(a.task_id) || []
    byTask.push(a.user_id)
    assigneesByTask.set(a.task_id, byTask)
  }

  // ─── 6. Global KPI ──────────────────────────────────────────────────────────
  const completedTasks = tasks.filter(t => t.status === TASK_STATUS_DONE).length
  const inProgressTasks = tasks.filter(t => TASK_STATUS_ACTIVE.includes(t.status)).length
  const overdueTasks = tasks.filter(t =>
    t.status === TASK_STATUS_OVERDUE ||
    (t.end_date && new Date(t.end_date) < now && t.status !== TASK_STATUS_DONE)
  ).length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ─── 7. Per-member KPI ──────────────────────────────────────────────────────
  const memberKpisRaw: Omit<MemberKpi, 'rank'>[] = []

  for (const user of users) {
    const userTaskIdSet = assigneesByUser.get(user.id)
    if (!userTaskIdSet || userTaskIdSet.size === 0) continue

    const userTasks = [...userTaskIdSet]
      .map(id => taskMap.get(id))
      .filter(Boolean) as (typeof tasks[0])[]

    const completed = userTasks.filter(t => t.status === TASK_STATUS_DONE).length
    const inProgress = userTasks.filter(t => TASK_STATUS_ACTIVE.includes(t.status)).length
    const overdue = userTasks.filter(t =>
      t.status === TASK_STATUS_OVERDUE ||
      (t.end_date && new Date(t.end_date) < now && t.status !== TASK_STATUS_DONE)
    ).length

    // On-time completion proxy: completed task with end_date >= date_updated (or no end_date)
    const onTimeCount = userTasks.filter(t => {
      if (t.status !== TASK_STATUS_DONE) return false
      if (!t.end_date) return true
      const completionProxy = t.date_updated ? new Date(t.date_updated) : now
      return completionProxy <= new Date(t.end_date)
    }).length

    const projectIds = new Set(userTasks.map(t => t.project_id))
    const projectCount = projectIdFilter
      ? (projectIds.has(projectIdFilter) ? 1 : 0)
      : projectIds.size

    const totalAssigned = userTaskIdSet.size
    const memberCompletionRate = totalAssigned > 0
      ? Math.round((completed / totalAssigned) * 100)
      : 0

    let avatarUrl = user.avatar || ''
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
      avatarUrl = `/avatars/${avatarUrl}`
    }

    memberKpisRaw.push({
      id: user.id,
      name: `${user.firstname} ${user.lastname || ''}`.trim(),
      avatar: avatarUrl,
      totalAssigned,
      completed,
      inProgress,
      overdue,
      completionRate: memberCompletionRate,
      projectCount,
      onTimeCount,
      performanceScore: computePerformanceScore(totalAssigned, completed, onTimeCount)
    })
  }

  // Sort with documented tie-break rules
  memberKpisRaw.sort((a, b) => {
    if (b.performanceScore !== a.performanceScore) return b.performanceScore - a.performanceScore
    if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate
    if (b.onTimeCount !== a.onTimeCount) return b.onTimeCount - a.onTimeCount
    if (b.totalAssigned !== a.totalAssigned) return b.totalAssigned - a.totalAssigned
    return a.name.localeCompare(b.name)
  })

  const memberKpis: MemberKpi[] = memberKpisRaw.map((m, idx) => ({ ...m, rank: idx + 1 }))

  // ─── 8. Project breakdown ────────────────────────────────────────────────────
  const projectBreakdowns: ProjectKpiDetail[] = []

  // Group tasks by project
  const tasksByProject = new Map<number, (typeof tasks[0])[]>()
  for (const t of tasks) {
    const existing = tasksByProject.get(t.project_id) || []
    existing.push(t)
    tasksByProject.set(t.project_id, existing)
  }

  for (const project of projects) {
    const projectTasks = tasksByProject.get(project.id) || []
    if (projectTasks.length === 0) continue

    const pCompleted = projectTasks.filter(t => t.status === TASK_STATUS_DONE).length
    const pInProgress = projectTasks.filter(t => TASK_STATUS_ACTIVE.includes(t.status)).length
    const pOverdue = projectTasks.filter(t =>
      t.status === TASK_STATUS_OVERDUE ||
      (t.end_date && new Date(t.end_date) < now && t.status !== TASK_STATUS_DONE)
    ).length
    const pTotal = projectTasks.length
    const pRate = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0

    // Member contributions — each task counts once per user (not double-counted)
    const memberContribMap = new Map<number, { assigned: number; completed: number }>()
    for (const task of projectTasks) {
      const taskUserIds = assigneesByTask.get(task.id) || []
      for (const userId of taskUserIds) {
        const existing = memberContribMap.get(userId) || { assigned: 0, completed: 0 }
        existing.assigned++
        if (task.status === TASK_STATUS_DONE) existing.completed++
        memberContribMap.set(userId, existing)
      }
    }

    const memberContributions = [...memberContribMap.entries()]
      .map(([userId, stats]) => {
        const u = userMap.get(userId)
        if (!u) return null
        let avatarUrl = u.avatar || ''
        if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
          avatarUrl = `/avatars/${avatarUrl}`
        }
        return {
          userId,
          name: `${u.firstname} ${u.lastname || ''}`.trim(),
          avatar: avatarUrl,
          assigned: stats.assigned,
          completed: stats.completed
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.completed - a.completed || b.assigned - a.assigned)

    projectBreakdowns.push({
      id: project.id,
      name: project.name,
      client: project.client_name || 'Internal',
      status: project.status,
      totalTasks: pTotal,
      completedTasks: pCompleted,
      inProgressTasks: pInProgress,
      overdueTasks: pOverdue,
      completionRate: pRate,
      memberContributions
    })
  }

  projectBreakdowns.sort((a, b) => b.totalTasks - a.totalTasks)

  return {
    periodLabel: label,
    globalKpi: { totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate },
    memberKpis,
    projectBreakdowns,
    allUsers: users.map(u => ({ id: u.id, name: `${u.firstname} ${u.lastname || ''}`.trim() })),
    allProjects: projects.map(p => ({ id: p.id, name: p.name }))
  }
}
