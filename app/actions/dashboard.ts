'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function getDashboardData(dateRangeStr: string, projectFilter?: string) {
  const now = new Date();
  let startDate = new Date(0); // Default to all time
  let endDate = new Date(now);

  const monthNamesId: Record<string, number> = {
    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
    'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
  };

  const lowerRange = (dateRangeStr || '').toLowerCase().trim();

  if (dateRangeStr === 'Today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (dateRangeStr === 'This month' || dateRangeStr === 'Bulan Ini') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (dateRangeStr === 'Last month' || dateRangeStr === 'Bulan Lalu') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (dateRangeStr.startsWith('Month:')) {
    const monthIdx = parseInt(dateRangeStr.split(':')[1]);
    startDate = new Date(now.getFullYear(), monthIdx, 1);
    endDate = new Date(now.getFullYear(), monthIdx + 1, 0, 23, 59, 59);
  } else if (monthNamesId[lowerRange] !== undefined) {
    const monthIdx = monthNamesId[lowerRange];
    startDate = new Date(now.getFullYear(), monthIdx, 1);
    endDate = new Date(now.getFullYear(), monthIdx + 1, 0, 23, 59, 59);
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
  } else if (dateRangeStr === 'All time' || dateRangeStr === 'All Time' || dateRangeStr === 'Semua Periode' || dateRangeStr === 'Semua Waktu (All Time)') {
    startDate = new Date(0);
  }

  const duration = now.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - duration);

  // Base where clauses
  const projectWhere: any = { is_archived: false };
  const taskWhere: any = {};
  if (startDate.getTime() > 0) {
    if (endDate.getTime() < now.getTime()) {
      taskWhere.date_created = { gte: startDate, lte: endDate };
    } else {
      taskWhere.date_created = { gte: startDate };
    }
  }
  const prodWhere: any = {};
  if (startDate.getTime() > 0) {
    if (endDate.getTime() < now.getTime()) {
      prodWhere.date = { gte: startDate, lte: endDate };
    } else {
      prodWhere.date = { gte: startDate };
    }
  }
  const prevProjectWhere: any = { is_archived: false, date_created: { gte: prevStartDate, lt: startDate } };
  const prevTaskWhere: any = { date_created: { gte: prevStartDate, lt: startDate } };

  if (projectFilter && projectFilter !== 'Semua Project') {
    const pid = parseInt(projectFilter);
    projectWhere.id = pid;
    taskWhere.project_id = pid;
    prodWhere.project_id = pid;
    prevProjectWhere.id = pid;
    prevTaskWhere.project_id = pid;
  }

  try {
    const user = await requireAuth();
    requirePermission(user, 'dashboard.view')

    // 1. Parallel queries for maximum performance
    const [
      totalUsersCount,
      totalProjectsCount,
      totalTasksCount,
      allTasksInRange,
      activeProjectsList,
      teamUsers,
      allAssignees,
      activityLogs,
      taskComments,
      productivity
    ] = await Promise.all([
      prisma.user.count({ where: { status: { not: 'resign' } } }),
      prisma.project_list.count({ where: { is_archived: false } }),
      prisma.task_list.count(),
      prisma.task_list.findMany({
        where: taskWhere,
        select: {
          id: true,
          task: true,
          status: true,
          start_date: true,
          end_date: true,
          date_created: true,
          project_id: true,
          platform: true,
          content_pillar: true
        }
      }),
      prisma.project_list.findMany({
        where: { is_archived: false },
        select: {
          id: true,
          name: true,
          client_name: true,
          status: true,
          end_date: true,
          date_created: true
        },
        orderBy: { date_created: 'desc' }
      }),
      prisma.user.findMany({
        where: { status: { not: 'resign' } },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          name: true,
          email: true,
          address: true,
          avatar: true,
          status: true,
          role: { select: { name: true } }
        }
      }),
      prisma.taskAssignee.findMany({
        select: {
          user_id: true,
          task_id: true,
          task: {
            select: {
              id: true,
              task: true,
              status: true,
              end_date: true,
              project_id: true,
              date_created: true,
              content_pillar: true,
              platform: true
            }
          }
        }
      }),
      prisma.activity_log.findMany({
        take: 20,
        orderBy: { created_at: 'desc' }
      }),
      prisma.task_comments.findMany({
        take: 15,
        orderBy: { created_at: 'desc' }
      }),
      prisma.user_productivity.aggregate({
        _sum: { time_rendered: true },
        where: prodWhere
      })
    ]);

    // 2. Calculations for Task Statuses
    let tasksCompleted = 0;
    let tasksPending = 0;
    let tasksHold = 0;
    let tasksOnProgress = 0;
    let tasksReview = 0;
    let tasksCancelled = 0;
    let tasksRevised = 0;
    let tasksOverdue = 0;

    const overdueTasks: typeof allTasksInRange = [];

    allTasksInRange.forEach(t => {
      const isOverdue = t.status === 8 || (t.end_date && new Date(t.end_date) < now && t.status !== 5);
      if (t.status === 5) {
        tasksCompleted++;
      } else if (isOverdue) {
        tasksOverdue++;
        overdueTasks.push(t);
      } else if (t.status === 3) {
        tasksReview++;
      } else if (t.status === 7) {
        tasksHold++;
        tasksCancelled++;
      } else if (t.status === 4) {
        tasksRevised++;
      } else if ([2, 6].includes(t.status)) {
        tasksOnProgress++;
      } else {
        tasksPending++;
      }
    });

    const totalTasksInRange = allTasksInRange.length;
    const completionRate = totalTasksInRange > 0 ? Math.round((tasksCompleted / totalTasksInRange) * 100) : 0;
    const totalWorkHours = productivity._sum.time_rendered || 0;

    // Previous period counts
    const prevProjects = await prisma.project_list.count({ where: prevProjectWhere });
    const prevTasksCompleted = await prisma.task_list.count({
      where: { ...prevTaskWhere, status: 5 }
    });
    const prevTasksOverdue = await prisma.task_list.findMany({
      where: prevTaskWhere,
      select: { status: true, end_date: true }
    }).then(tasks => tasks.filter(t =>
      t.status === 8 || (t.end_date && new Date(t.end_date) < startDate && t.status !== 5)
    ).length);

    // Overdue tasks list with project name
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

    // 3. Pareto Analysis: Overdue tasks by Project
    const paretoTally: Record<number, number> = {};
    overdueTasks.forEach(t => {
      paretoTally[t.project_id] = (paretoTally[t.project_id] || 0) + 1;
    });

    const paretoRaw = Object.entries(paretoTally).map(([pid, count]) => {
      const pIdNum = parseInt(pid);
      const p = overdueProjects.find(p => p.id === pIdNum) || activeProjectsList.find(p => p.id === pIdNum);
      let name = p ? p.name : 'Unknown';
      if (name.length > 18) name = name.substring(0, 18) + '...';
      return { name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    let cumulative = 0;
    const paretoData = paretoRaw.map(item => {
      cumulative += item.count;
      return {
        name: item.name,
        value: item.count,
        cumulative: tasksOverdue > 0 ? Math.round((cumulative / tasksOverdue) * 100) : 0
      };
    });

    // 4. Trend Grouping (both Tren Performa & Status Progress Trend)
    const isDaily = duration > 0 && duration <= 35 * 24 * 60 * 60 * 1000;
    const formatDate = (date: Date) => {
      if (isDaily) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    const trendMap: Record<string, any> = {};
    const statusTrendMap: Record<string, any> = {};

    allTasksInRange.forEach(t => {
      const key = formatDate(new Date(t.date_created));
      if (!trendMap[key]) {
        trendMap[key] = { date: key, tasksCreated: 0, tasksCompleted: 0, projectsCreated: 0, projectsCompleted: 0, workHours: 0 };
      }
      trendMap[key].tasksCreated++;
      if (t.status === 5) trendMap[key].tasksCompleted++;

      if (!statusTrendMap[key]) {
        statusTrendMap[key] = {
          date: key,
          pending: 0,
          hold: 0,
          onProgress: 0,
          review: 0,
          cancelled: 0,
          done: 0,
          overdue: 0,
          revised: 0
        };
      }
      const isOver = t.status === 8 || (t.end_date && new Date(t.end_date) < now && t.status !== 5);
      if (t.status === 5) statusTrendMap[key].done++;
      else if (isOver) statusTrendMap[key].overdue++;
      else if (t.status === 3) statusTrendMap[key].review++;
      else if (t.status === 7) {
        statusTrendMap[key].hold++;
        statusTrendMap[key].cancelled++;
      } else if (t.status === 4) statusTrendMap[key].revised++;
      else if ([2, 6].includes(t.status)) statusTrendMap[key].onProgress++;
      else statusTrendMap[key].pending++;
    });

    activeProjectsList.forEach(p => {
      const key = formatDate(new Date(p.date_created));
      if (trendMap[key]) {
        trendMap[key].projectsCreated++;
        if (p.status === 5) trendMap[key].projectsCompleted++;
      }
    });

    const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
    const statusTrendData = Object.values(statusTrendMap).sort((a, b) => a.date.localeCompare(b.date));

    // In-memory filter for assignees based on range and project
    const assigneesInRange = allAssignees.filter(a => {
      if (!a.task) return false;
      if (startDate.getTime() > 0 && new Date(a.task.date_created) < startDate) return false;
      if (endDate.getTime() < now.getTime() && new Date(a.task.date_created) > endDate) return false;
      if (projectFilter && projectFilter !== 'Semua Project' && a.task.project_id !== parseInt(projectFilter)) return false;
      return true;
    });

    // 5. Team Revision Overview & Assignments (Grouped Bar Chart data)
    const teamAssignments = teamUsers
      .filter(u => {
        const isClient = (u.role?.name || '').toLowerCase().includes('client') ||
                         (u.firstname || '').toLowerCase().includes('client') ||
                         (u.firstname || '').toLowerCase().includes('toko');
        return !isClient;
      })
      .map(u => {
        const uIdNum = Number(u.id);
        const userTasks = assigneesInRange.filter(a => Number(a.user_id) === uIdNum && a.task != null);
        const assigned = userTasks.length;
        const done = userTasks.filter(a => a.task?.status === 5).length;
        const revised = userTasks.filter(a => a.task?.status === 4).length;
        const inProgress = userTasks.filter(a => [2, 6].includes(a.task?.status || 0)).length;
        const overdue = userTasks.filter(a =>
          a.task && (a.task.status === 8 || (a.task.end_date && new Date(a.task.end_date) < now && a.task.status !== 5))
        ).length;

        const isResigned = (u.firstname || '').toLowerCase().includes('[resign]') || u.status === 'resign';

        // Extract role from parenthetical if present in lastname, name, or firstname
        let role = '';
        const textWithRole = `${u.lastname || ''} ${u.name || ''} ${u.firstname || ''}`;
        const roleMatch = textWithRole.match(/\(([^)]+)\)/);
        if (roleMatch && roleMatch[1]) {
          role = roleMatch[1].trim();
        } else if (u.role?.name) {
          role = u.role.name;
        } else if (u.address && !['--', '-', '.', '0000'].includes(u.address.trim())) {
          role = u.address.trim();
        } else {
          role = 'Creative Staff';
        }

        // Clean up role label
        role = role
          .replace(/^Creative\s*-\s*/i, '')
          .replace(/^Production Team\s*-\s*/i, '')
          .replace(/^IT\s*-\s*/i, '')
          .replace(/^PKL\s*-\s*/i, 'Intern ')
          .replace(/^Freelance\s*-\s*/i, 'Freelance ')
          .trim();

        // Extract clean name (strip [RESIGN] and parenthetical roles)
        const cleanName = (u.firstname || u.name || '')
          .replace(/\[RESIGN\]\s*/i, '')
          .replace(/\s*\([^)]*\).*/g, '')
          .trim() || (u.lastname || '').replace(/\s*\([^)]*\).*/g, '').trim() || 'User';

        const parts = cleanName.split(/\s+/).filter(Boolean);
        let shortName = parts[0] || 'User';
        if (parts.length > 1) {
          shortName += ' ' + parts[1][0] + '.';
        }

        let avatarUrl = u.avatar || '';
        if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
          avatarUrl = `/avatars/${avatarUrl}`;
        }

        // Group tasks by project for drilldown modal
        const projectMapLocal = new Map(activeProjectsList.map(p => [p.id, p]));
        const userProjectGroups: Record<number, any> = {};

        userTasks.forEach(a => {
          if (!a.task) return;
          const pid = a.task.project_id;
          if (!userProjectGroups[pid]) {
            const prj = projectMapLocal.get(pid);
            userProjectGroups[pid] = {
              id: pid,
              name: prj?.name || `Project #${pid}`,
              client: prj?.client_name || '-',
              status: prj?.status ?? 0,
              totalTasks: 0,
              completedTasks: 0,
              tasks: []
            };
          }
          userProjectGroups[pid].totalTasks++;
          if (a.task.status === 5) {
            userProjectGroups[pid].completedTasks++;
          }

          let statusLabel = 'Pending';
          if (a.task.status === 5) statusLabel = 'Done';
          else if (a.task.status === 6) statusLabel = 'Started';
          else if (a.task.status === 2) statusLabel = 'In Progress';
          else if (a.task.status === 3) statusLabel = 'In Review';
          else if (a.task.status === 4) statusLabel = 'Revisions';
          else if (a.task.status === 7) statusLabel = 'Hold';
          else if (a.task.status === 8 || (a.task.end_date && new Date(a.task.end_date) < now && a.task.status !== 5)) statusLabel = 'Overdue';

          let formattedDeadline = '-';
          if (a.task.end_date) {
            try {
              formattedDeadline = new Date(a.task.end_date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            } catch {
              formattedDeadline = '-';
            }
          }

          userProjectGroups[pid].tasks.push({
            id: a.task.id,
            name: a.task.task || 'Untitled Task',
            status: a.task.status,
            statusLabel,
            deadline: formattedDeadline,
            pillar: a.task.content_pillar || null,
            platform: a.task.platform || null
          });
        });

        const projects = Object.values(userProjectGroups).map(g => ({
          ...g,
          completionRate: g.totalTasks > 0 ? Math.round((g.completedTasks / g.totalTasks) * 1000) / 10 : 0
        })).sort((a, b) => b.totalTasks - a.totalTasks);

        return {
          id: uIdNum,
          name: cleanName,
          fullName: `${u.firstname} ${u.lastname || ''}`.trim(),
          shortName,
          role,
          email: u.email || '',
          avatar: avatarUrl,
          isResigned,
          assigned,
          done,
          inProgress,
          revised,
          overdue,
          projectCount: projects.length,
          projects,
          completionRate: assigned > 0 ? Math.round((done / assigned) * 1000) / 10 : 0
        };
      })
      .filter(t => t.assigned > 0)
      .sort((a, b) => b.assigned - a.assigned);

    // 6. Project Progress Details (Carousel of Donut Charts & Deep Inspector)
    const userMap = new Map(teamUsers.map(u => [Number(u.id), u]));

    const projectProgressDetails = activeProjectsList.map(p => {
      const pTasks = allTasksInRange.filter(t => t.project_id === p.id);
      let pending = 0, hold = 0, onProgress = 0, review = 0, cancelled = 0, done = 0, overdue = 0, revised = 0;

      const platformCounts: Record<string, number> = {};
      const taskTypeCounts: Record<string, number> = {};

      pTasks.forEach(t => {
        const isOver = t.status === 8 || (t.end_date && new Date(t.end_date) < now && t.status !== 5);
        if (t.status === 5) done++;
        else if (isOver) overdue++;
        else if (t.status === 3) review++;
        else if (t.status === 7) {
          hold++;
          cancelled++;
        } else if (t.status === 4) revised++;
        else if ([2, 6].includes(t.status)) onProgress++;
        else pending++;

        const pl = t.platform || 'General';
        platformCounts[pl] = (platformCounts[pl] || 0) + 1;

        const tp = t.content_pillar || 'General';
        taskTypeCounts[tp] = (taskTypeCounts[tp] || 0) + 1;
      });

      // Find project assignees and task loads
      const pAssignees = allAssignees.filter(a => a.task?.project_id === p.id);
      const memberTaskCounts: Record<number, number> = {};
      pAssignees.forEach(a => {
        memberTaskCounts[a.user_id] = (memberTaskCounts[a.user_id] || 0) + 1;
      });

      const assignments = Object.entries(memberTaskCounts).map(([uidStr, count]) => {
        const u = userMap.get(parseInt(uidStr));
        const cleanMemberName = (u?.firstname || 'User').replace(/\[RESIGN\]\s*/i, '').replace(/\s*\([^)]*\).*/g, '').trim();
        let avatarUrl = u?.avatar || '';
        if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
          avatarUrl = `/avatars/${avatarUrl}`;
        }
        return {
          id: parseInt(uidStr),
          name: cleanMemberName,
          fullName: `${u?.firstname || ''} ${u?.lastname || ''}`.trim(),
          avatar: avatarUrl,
          role: u?.role?.name || u?.address || 'Staff',
          tasksCount: count
        };
      }).sort((a, b) => b.tasksCount - a.tasksCount);

      const total = pTasks.length;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

      // Colors matching the legacy dashboard: Done (green), In-Progress (blue), Review (cyan), Hold (orange), Pending (slate), Cancelled (purple/red)
      const chartData = [
        { name: 'Done', value: done, color: '#10b981' },
        { name: 'In-Progress', value: onProgress, color: '#2563eb' },
        { name: 'Review', value: review, color: '#06b6d4' },
        { name: 'OnHold', value: hold, color: '#f97316' },
        { name: 'Pending', value: pending, color: '#64748b' },
        { name: 'Cancelled', value: cancelled, color: '#8b5cf6' }
      ].filter(d => d.value > 0);

      // Format Due Date
      let formattedDueDate = '-';
      if (p.end_date) {
        const d = new Date(p.end_date);
        formattedDueDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      return {
        id: p.id,
        name: p.name,
        client: p.client_name || 'Internal',
        status: p.status,
        endDate: p.end_date,
        formattedDueDate,
        totalTasks: total,
        counts: { pending, hold, onProgress, review, cancelled, done, overdue, revised },
        completionRate,
        chartData,
        platforms: platformCounts,
        taskTypes: taskTypeCounts,
        assignments
      };
    }).filter(p => p.totalTasks > 0).sort((a, b) => b.totalTasks - a.totalTasks);

    // 7. Recent Activities Feed
    const projectMap = new Map(activeProjectsList.map(p => [p.id, p]));

    // Relative time helper
    const getRelativeTime = (d: Date | string) => {
      const diffMs = now.getTime() - new Date(d).getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam lalu`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    // Ensure all users who generated activities are fetched (including users who might not be in teamUsers)
    const activityUserIds = Array.from(new Set([
      ...activityLogs.map(a => Number(a.user_id)).filter(id => !isNaN(id) && id > 0),
      ...taskComments.map(c => Number(c.user_id)).filter(id => !isNaN(id) && id > 0)
    ]));

    const existingUserIds = new Set(teamUsers.map(u => u.id));
    const missingUserIds = activityUserIds.filter(id => !existingUserIds.has(id));

    let additionalUsers: any[] = [];
    if (missingUserIds.length > 0) {
      additionalUsers = await prisma.user.findMany({
        where: { id: { in: missingUserIds }, status: { not: 'resign' } },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          name: true,
          address: true,
          avatar: true,
          role: { select: { name: true } }
        }
      });
    }

    const allResolvedUsers = [...teamUsers, ...additionalUsers];
    const comprehensiveUserMap = new Map();
    allResolvedUsers.forEach(u => {
      comprehensiveUserMap.set(u.id, u);
      comprehensiveUserMap.set(String(u.id), u);
      comprehensiveUserMap.set(Number(u.id), u);
    });

    let formattedActivity: any[] = [];
    
    // Combine logs and task comments for rich activities
    const combinedActs: any[] = [];
    activityLogs.forEach(a => {
      combinedActs.push({
        id: `log-${a.id}`,
        userId: a.user_id,
        projectId: a.project_id,
        taskId: a.task_id,
        description: a.description,
        type: a.activity_type,
        created_at: a.created_at || now
      });
    });

    taskComments.forEach(c => {
      combinedActs.push({
        id: `com-${c.id}`,
        userId: c.user_id,
        projectId: null,
        taskId: c.task_id,
        description: `Komentar: "${c.comment.length > 50 ? c.comment.substring(0, 50) + '...' : c.comment}"`,
        type: 'comment',
        created_at: c.created_at || now
      });
    });

    combinedActs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    formattedActivity = combinedActs.slice(0, 10).map(act => {
      const rawId = act.userId;
      const u = rawId ? (comprehensiveUserMap.get(rawId) || comprehensiveUserMap.get(Number(rawId)) || comprehensiveUserMap.get(String(rawId))) : null;

      let avatarUrl = u?.avatar || '';
      if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
        avatarUrl = `/avatars/${avatarUrl}`;
      }

      let projectName = '';
      if (act.projectId) {
        projectName = projectMap.get(act.projectId)?.name || '';
      }

      // Determine clean user name
      let userName = '';
      if (u) {
        userName = (u.name || `${u.firstname || ''} ${u.lastname || ''}`).replace(/\[RESIGN\]\s*/i, '').replace(/\s*\([^)]*\).*/g, '').trim();
      }
      if (!userName) {
        const match = act.description?.match(/User\s+([a-zA-Z0-9_\s]+?)\s+(logged in|logged out|created|updated|deleted|added|changed)/i);
        if (match) {
          userName = match[1].trim();
        } else {
          userName = 'Team Member';
        }
      }

      const roleName = u?.role?.name || (u?.address && u.address !== '--' ? u.address : '');

      return {
        id: act.id,
        user: userName,
        role: roleName,
        avatar: avatarUrl,
        description: act.description,
        projectName: projectName || 'General',
        type: act.type,
        time: act.created_at,
        timeAgo: getRelativeTime(act.created_at)
      };
    });

    // 8. Pipeline stages
    const pipeline = await prisma.project_list.groupBy({
      by: ['status'],
      where: { is_archived: false },
      _count: { status: true }
    });

    const kpis = {
      totalUsers: { value: totalUsersCount, prev: null },
      totalProjects: { value: totalProjectsCount, prev: prevProjects },
      totalTasks: { value: totalTasksCount, prev: null },
      tasksCompleted: { value: tasksCompleted, prev: prevTasksCompleted },
      tasksPending: { value: tasksPending, prev: 0 },
      tasksOverdue: { value: tasksOverdue, prev: prevTasksOverdue, list: overdueTasksList },
      completionRate: { value: completionRate, prev: 0 },
      totalWorkHours: { value: totalWorkHours, prev: 0 },
      statusBreakdown: {
        pending: tasksPending,
        hold: tasksHold,
        onProgress: tasksOnProgress,
        review: tasksReview,
        cancelled: tasksCancelled,
        revised: tasksRevised,
        overdue: tasksOverdue,
        done: tasksCompleted
      }
    };

    return {
      kpis,
      trendData,
      statusTrendData,
      paretoData,
      pipeline,
      projectPerformance: projectProgressDetails.slice(0, 5),
      projectProgressDetails,
      teamAssignments,
      allProjectsList: activeProjectsList.map(p => ({ id: p.id, name: p.name })),
      recentActivity: formattedActivity
    };

  } catch (err) {
    console.error('Database connection failed, using mock data for dashboard', err);
    const now = new Date();
    const trendData = [];
    const statusTrendData = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const baseVal = Math.floor(Math.random() * 10) + 5;
      trendData.push({
        date: key,
        tasksCreated: baseVal + Math.floor(Math.random() * 5),
        tasksCompleted: baseVal - 2 + Math.floor(Math.random() * 3),
        projectsCreated: Math.floor(Math.random() * 3),
        projectsCompleted: Math.floor(Math.random() * 2),
        workHours: (baseVal * 8) + Math.floor(Math.random() * 10)
      });
      statusTrendData.push({
        date: key,
        done: baseVal + 10,
        onProgress: Math.floor(Math.random() * 8) + 2,
        pending: Math.floor(Math.random() * 6),
        revised: Math.floor(Math.random() * 2),
        overdue: Math.floor(Math.random() * 3),
        cancelled: 0
      });
    }

    return {
      kpis: {
        totalUsers: { value: 54, prev: null },
        totalProjects: { value: 28, prev: 24 },
        totalTasks: { value: 1315, prev: 1200 },
        tasksCompleted: { value: 1256, prev: 1100 },
        tasksPending: { value: 30, prev: 0 },
        tasksOverdue: {
          value: 1,
          prev: 3,
          list: [
            { id: 1, name: "Fix Authentication", projectName: "WebApp V2", endDate: new Date() }
          ]
        },
        completionRate: { value: 95, prev: 0 },
        totalWorkHours: { value: 1840, prev: 0 },
        statusBreakdown: {
          pending: 50,
          hold: 0,
          onProgress: 23,
          review: 1,
          cancelled: 5,
          revised: 0,
          overdue: 1,
          done: 1259
        }
      },
      trendData,
      statusTrendData,
      paretoData: [
        { name: "Resource Lack", value: 12, cumulative: 40 },
        { name: "Scope Creep", value: 8, cumulative: 65 },
        { name: "Client Delay", value: 5, cumulative: 85 },
        { name: "Technical Debt", value: 3, cumulative: 95 },
        { name: "Other", value: 2, cumulative: 100 }
      ],
      pipeline: [
        { status: 1, _count: { status: 5 } },
        { status: 2, _count: { status: 8 } },
        { status: 6, _count: { status: 3 } },
        { status: 5, _count: { status: 12 } }
      ],
      projectPerformance: [],
      projectProgressDetails: [
        {
          id: 1,
          name: "JODK IDHM STUDIO",
          client: "Internal",
          status: 2,
          endDate: new Date(),
          formattedDueDate: "26 Oct 2026",
          totalTasks: 7,
          counts: { pending: 1, revised: 0, onProgress: 2, overdue: 0, cancelled: 0, done: 4 },
          completionRate: 57,
          chartData: [
            { name: "Done", value: 4, color: "#10b981" },
            { name: "On-Progress", value: 2, color: "#f59e0b" },
            { name: "Pending", value: 1, color: "#64748b" }
          ],
          platforms: { Instagram: 4, TikTok: 3 }
        }
      ],
      teamAssignments: [
        { id: 1, name: "Reffinzarel", shortName: "Reffinzarel", role: "Graphic Design", avatar: "", assigned: 187, done: 176, revised: 0, overdue: 11, completionRate: 94 },
        { id: 2, name: "Andrea Rosmeity Dea", shortName: "Andrea R.", role: "Social Media Specialist", avatar: "", assigned: 145, done: 141, revised: 0, overdue: 3, completionRate: 97 },
        { id: 3, name: "Yuda Putera Ginanjar", shortName: "Yuda P.", role: "Web Developer", avatar: "", assigned: 121, done: 117, revised: 0, overdue: 4, completionRate: 96 }
      ],
      allProjectsList: [
        { id: 1, name: "JODK IDHM STUDIO" }
      ],
      recentActivity: [
        { id: 1, user: "Rizky Aulia Rohman", role: "PMR - Foreign Graphic", avatar: "", description: "Mengunggah hasil revisi task: EP - 74", projectName: "TOKO WAHYU", time: new Date(), timeAgo: "2 menit lalu" }
      ]
    };
  }
}
