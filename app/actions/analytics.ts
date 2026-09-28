'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/authorization'

export async function getAdvancedAnalytics(dateRangeStr: string) {
  await requireAuth();

  const now = new Date();
  let startDate = new Date(0); // Default all time

  if (dateRangeStr === 'Last 7 days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRangeStr === 'Last 30 days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (dateRangeStr === 'This year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  // 1. Team Workload Analytics
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, avatar: true }
  });

  const activeTasks = await prisma.task_list.findMany({
    where: { status: { in: [1, 2, 3, 6, 7] } }, // Active statuses
    include: { assignees: true }
  });

  const productivity = await prisma.user_productivity.groupBy({
    by: ['user_id'],
    _sum: { time_rendered: true },
    where: { date: { gte: startDate } }
  });

  const standardHoursPerWeek = 40; // 40 hours standard capacity
  let weeksCount = Math.round((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1;
  if (weeksCount > 52) weeksCount = 4; // If all time, default capacity comparison to a month for simplicity

  const teamWorkload = allUsers.map(user => {
    // Count tasks assigned to this user
    let activeTaskCount = 0;
    activeTasks.forEach(task => {
      if (task.assignees.some(a => a.user_id === user.id) || task.user_id === user.id) {
        activeTaskCount++;
      }
    });

    const hoursLogged = productivity.find(p => p.user_id === user.id)?._sum.time_rendered || 0;
    const capacity = standardHoursPerWeek * weeksCount;
    let status = 'Optimal';
    if (hoursLogged > capacity * 1.1) status = 'Overload';
    if (hoursLogged < capacity * 0.75) status = 'Underutilized';

    return {
      id: user.id,
      name: user.name || 'Unknown',
      avatar: user.avatar,
      activeTasks: activeTaskCount,
      hoursLogged: Math.round(hoursLogged * 10) / 10,
      capacity,
      status
    };
  }); // Show all members

  // 2. Client Health Analytics
  const projects = await prisma.project_list.findMany({
    where: { is_archived: false },
    select: { id: true, client_name: true, status: true }
  });

  const allTasksForClient = await prisma.task_list.findMany({
    where: { project_id: { in: projects.map(p => p.id) }, date_created: { gte: startDate } },
    select: { project_id: true, status: true, end_date: true }
  });

  // Group by client
  const clientMap: Record<string, any> = {};

  projects.forEach(p => {
    const cName = p.client_name?.trim() || 'Internal/No Client';
    if (!clientMap[cName]) {
      clientMap[cName] = { totalProjects: 0, completedProjects: 0, tasksTotal: 0, tasksRevisions: 0, tasksOverdue: 0, tasksCompleted: 0 };
    }
    clientMap[cName].totalProjects++;
    if (p.status === 5) clientMap[cName].completedProjects++;
  });

  allTasksForClient.forEach(t => {
    const project = projects.find(p => p.id === t.project_id);
    if (!project) return;
    const cName = project.client_name?.trim() || 'Internal/No Client';

    clientMap[cName].tasksTotal++;
    if (t.status === 4) clientMap[cName].tasksRevisions++; // 4 = Revisions
    if (t.status === 5) clientMap[cName].tasksCompleted++;
    if (t.status === 8 || (t.end_date && new Date(t.end_date) < now && t.status !== 5)) {
      clientMap[cName].tasksOverdue++;
    }
  });

  const clientHealth = Object.keys(clientMap).map(clientName => {
    const data = clientMap[clientName];
    const delayRate = data.tasksTotal > 0 ? (data.tasksOverdue / data.tasksTotal) * 100 : 0;
    const revisionRate = data.tasksTotal > 0 ? (data.tasksRevisions / data.tasksTotal) * 100 : 0;
    
    let healthScore = 100 - (delayRate * 0.5) - (revisionRate * 0.5);
    if (healthScore < 0) healthScore = 0;

    return {
      name: clientName,
      ...data,
      delayRate: Math.round(delayRate),
      revisionRate: Math.round(revisionRate),
      healthScore: Math.round(healthScore)
    };
  }).sort((a, b) => b.totalProjects - a.totalProjects);

  return { teamWorkload, clientHealth };
}
