'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/authorization'

export async function getDashboardData(dateRangeStr: string, projectFilter?: string) {
  const user = await requireAuth();

  const now = new Date();
  let startDate = new Date(0); // Default to all time

  if (dateRangeStr === 'Today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (dateRangeStr === 'Last 7 days') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 7);
  } else if (dateRangeStr === 'Last 30 days') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 30);
  } else if (dateRangeStr === 'Last 3 months') {
    startDate = new Date();
    startDate.setMonth(now.getMonth() - 3);
  } else if (dateRangeStr === 'Last 6 months') {
    startDate = new Date();
    startDate.setMonth(now.getMonth() - 6);
  } else if (dateRangeStr === 'This year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }


  const duration = now.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - duration);

  // Base where clauses
  const projectWhere: any = { is_archived: false, date_created: { gte: startDate } };
  const taskWhere: any = { date_created: { gte: startDate } };
  const prodWhere: any = { date: { gte: startDate } };
  const prevProjectWhere: any = { is_archived: false, date_created: { gte: prevStartDate, lt: startDate } };
  const prevTaskWhere: any = { date_created: { gte: prevStartDate, lt: startDate } };
  const trendTaskWhere: any = { date_created: { gte: startDate } };
  const trendProjectWhere: any = { date_created: { gte: startDate } };
  const trendProdWhere: any = { date: { gte: startDate } };
  const pipelineWhere: any = { is_archived: false };
  const activeProjectsWhere: any = { is_archived: false, status: { notIn: [5, 0] } };

  if (projectFilter && projectFilter !== 'Semua Project') {
    const pid = parseInt(projectFilter);
    projectWhere.id = pid;
    taskWhere.project_id = pid;
    prodWhere.project_id = pid;
    prevProjectWhere.id = pid;
    prevTaskWhere.project_id = pid;
    trendTaskWhere.project_id = pid;
    trendProjectWhere.id = pid;
    trendProdWhere.project_id = pid;
    pipelineWhere.id = pid;
    activeProjectsWhere.id = pid;
  }

  // 1. KPIs
  const totalProjects = await prisma.project_list.count({
    where: projectWhere
  });

  const allTasksInRange = await prisma.task_list.findMany({
    where: taskWhere,
    select: { status: true, start_date: true, end_date: true, id: true, task: true, project_id: true }
  });

  const tasksCompleted = allTasksInRange.filter(t => t.status === 5).length;
  // Not done and not overdue
  const tasksPending = allTasksInRange.filter(t => t.status !== 5 && t.status !== 8).length; 
  const overdueTasks = allTasksInRange.filter(t => 
    t.status === 8 || (t.end_date && new Date(t.end_date) < now && t.status !== 5)
  );
  
  
  const tasksOverdue = overdueTasks.length;
  
  // Fetch project names for overdue tasks
  const overdueProjectIds = [...new Set(overdueTasks.map(t => t.project_id))];
  const overdueProjects = overdueProjectIds.length > 0 
    ? await prisma.project_list.findMany({ where: { id: { in: overdueProjectIds } }, select: { id: true, name: true } })
    : [];

  const overdueTasksList = overdueTasks.slice(0, 5).map(t => ({
    id: t.id,
    name: t.task,
    projectName: overdueProjects.find(p => p.id === t.project_id)?.name || 'Unknown Project',
    endDate: t.end_date
  }));

  // Pareto Analysis: Overdue tasks by Project
  const paretoTally: Record<number, number> = {};
  overdueTasks.forEach(t => {
    paretoTally[t.project_id] = (paretoTally[t.project_id] || 0) + 1;
  });

  const paretoRaw = Object.entries(paretoTally).map(([pid, count]) => {
    const pIdNum = parseInt(pid);
    const p = overdueProjects.find(p => p.id === pIdNum);
    let name = p ? p.name : 'Unknown';
    if (name.length > 15) name = name.substring(0, 15) + '...';
    return { name, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  let cumulative = 0;
  const totalParetoCount = paretoRaw.reduce((sum, item) => sum + item.count, 0) || 1; // avoid division by 0
  const paretoData = paretoRaw.map(item => {
    cumulative += item.count;
    return {
      name: item.name,
      value: item.count,
      cumulative: Math.round((cumulative / tasksOverdue) * 100)
    };
  });

  const totalTasks = allTasksInRange.length;
  const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  // Work Hours
  const productivity = await prisma.user_productivity.aggregate({
    _sum: { time_rendered: true },
    where: prodWhere
  });
  const totalWorkHours = productivity._sum.time_rendered || 0;

  // Previous Period Calculation (Simple comparison)
  
  const prevProjects = await prisma.project_list.count({
    where: prevProjectWhere
  });
  
  const prevTasksCompleted = await prisma.task_list.count({
    where: { ...prevTaskWhere, status: 5 }
  });
  
  const prevTasksOverdue = await prisma.task_list.findMany({
    where: prevTaskWhere,
    select: { status: true, end_date: true }
  }).then(tasks => tasks.filter(t => 
    t.status === 8 || (t.end_date && new Date(t.end_date) < startDate && t.status !== 5)
  ).length);

  const kpis = {
    totalProjects: { value: totalProjects, prev: prevProjects },
    tasksCompleted: { value: tasksCompleted, prev: prevTasksCompleted },
    tasksPending: { value: tasksPending, prev: 0 },
    tasksOverdue: { value: tasksOverdue, prev: prevTasksOverdue, list: overdueTasksList },
    completionRate: { value: completionRate, prev: 0 },
    totalWorkHours: { value: totalWorkHours, prev: 0 }
  };

  // 2. Trend Analytics
  // Grouping by day/month depending on range. For simplicity, let's group by Month if > 30 days, else Day.
  const isDaily = duration <= 30 * 24 * 60 * 60 * 1000;
  
  const trendTasks = await prisma.task_list.findMany({
    where: trendTaskWhere,
    select: { date_created: true, status: true }
  });
  
  const trendProjects = await prisma.project_list.findMany({
    where: trendTaskWhere,
    select: { date_created: true, status: true }
  });

  const trendMap: Record<string, any> = {};
  
  const formatDate = (date: Date) => {
    if (isDaily) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  trendTasks.forEach(t => {
    const key = formatDate(new Date(t.date_created));
    if (!trendMap[key]) trendMap[key] = { date: key, tasksCreated: 0, tasksCompleted: 0, projectsCreated: 0, projectsCompleted: 0, workHours: 0 };
    trendMap[key].tasksCreated++;
    if (t.status === 5) trendMap[key].tasksCompleted++;
  });

  trendProjects.forEach(p => {
    const key = formatDate(new Date(p.date_created));
    if (!trendMap[key]) trendMap[key] = { date: key, tasksCreated: 0, tasksCompleted: 0, projectsCreated: 0, projectsCompleted: 0, workHours: 0 };
    trendMap[key].projectsCreated++;
    if (p.status === 5) trendMap[key].projectsCompleted++;
  });

  const trendWorkHours = await prisma.user_productivity.findMany({
    where: trendProdWhere,
    select: { date: true, time_rendered: true }
  });
  trendWorkHours.forEach(w => {
    const key = formatDate(new Date(w.date));
    if (!trendMap[key]) trendMap[key] = { date: key, tasksCreated: 0, tasksCompleted: 0, projectsCreated: 0, projectsCompleted: 0, workHours: 0 };
    trendMap[key].workHours += Number(w.time_rendered || 0);
  });

  const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  // 3. Pipeline (Project Statuses)
  const pipeline = await prisma.project_list.groupBy({
    by: ['status'],
    where: pipelineWhere,
    _count: { status: true }
  });

  // 4. Project Performance (Top 5 active projects)
  const activeProjects = await prisma.project_list.findMany({
    where: activeProjectsWhere,
    include: {
      _count: { select: { meetings: true } } // Placeholder, really we want task progress
    },
    orderBy: { date_created: 'desc' },
    take: 5
  });

  // Since we can't easily query related task count in a single prisma query easily without deep includes,
  // we'll fetch tasks for these projects
  const activeProjectIds = activeProjects.map(p => p.id);
  const projectTasksData = await prisma.task_list.groupBy({
    by: ['project_id', 'status'],
    where: { project_id: { in: activeProjectIds } },
    _count: { id: true }
  });

  const projectPerformance = activeProjects.map(p => {
    const tasks = projectTasksData.filter(t => t.project_id === p.id);
    const total = tasks.reduce((sum, t) => sum + t._count.id, 0);
    const completed = tasks.find(t => t.status === 5)?._count.id || 0;
    return {
      id: p.id,
      name: p.name,
      client: p.client_name || 'Internal',
      status: p.status,
      deadline: p.end_date,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // 5. Team Performance (Top 5 assignees)
  const teamTasks = await prisma.taskAssignee.groupBy({
    by: ['user_id'],
    _count: { task_id: true }
  });
  
  // Need to join with User and task status
  const teamUsers = await prisma.user.findMany({
    where: { id: { in: teamTasks.map(t => t.user_id) } },
    select: { id: true, firstname: true, lastname: true, avatar: true }
  });

  // For accurate pending/completed per user:
  const allUserTasks = await prisma.taskAssignee.findMany({
    include: { task: { select: { status: true } } }
  });

  const teamPerformance = teamUsers.map(u => {
    const userTasks = allUserTasks.filter(t => t.user_id === u.id);
    const completed = userTasks.filter(t => t.task.status === 5).length;
    const pending = userTasks.filter(t => t.task.status !== 5).length;
    
    // Format avatar
    let avatarUrl = u.avatar || '';
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
      avatarUrl = `/avatars/${avatarUrl}`;
    }

    return {
      id: u.id,
      name: `${u.firstname} ${u.lastname || ''}`.trim(),
      avatar: avatarUrl,
      completed,
      pending
    };
  }).sort((a, b) => b.completed - a.completed).slice(0, 5);

  // 6. Recent Activity
  let formattedActivity: any[] = [];
  try {
    // If Prisma schema error on include user, we fetch manually
    const activities = await prisma.activity_log.findMany({ orderBy: { created_at: 'desc' }, take: 8 });
    const userIds = activities.map(a => a.user_id).filter((v, i, a) => a.indexOf(v) === i);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstname: true, lastname: true, avatar: true } });
    formattedActivity = activities.map(a => {
      const u = users.find(u => u.id === a.user_id);
      
      let avatarUrl = u?.avatar || '';
      if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
        avatarUrl = `/avatars/${avatarUrl}`;
      }
      
      return {
        id: a.id,
        user: u ? `${u.firstname} ${u.lastname || ''}`.trim() : 'System / Deleted User',
        avatar: avatarUrl,
        description: a.description,
        type: a.activity_type,
        time: a.created_at
      };
    });
  } catch (e) {
    formattedActivity = [];
  }

  return {
    kpis,
    trendData,
    paretoData,
    pipeline,
    projectPerformance,
    teamPerformance,
    recentActivity: formattedActivity
  };
}
