import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const validUserIds = new Set(users.map(u => u.id));

  // Analyze project_list
  const projects = await prisma.project_list.findMany({ select: { id: true, user_ids: true } });
  let projectAssignmentsToMigrate = 0;
  let invalidProjectUserIds = new Set<number>();

  for (const project of projects) {
    if (project.user_ids) {
      const ids = project.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const id of ids) {
        if (validUserIds.has(id)) {
          projectAssignmentsToMigrate++;
        } else {
          invalidProjectUserIds.add(id);
        }
      }
    }
  }

  // Analyze task_list
  const tasks = await prisma.task_list.findMany({ select: { id: true, user_ids: true } });
  let taskAssignmentsToMigrate = 0;
  let invalidTaskUserIds = new Set<number>();

  for (const task of tasks) {
    if (task.user_ids) {
      const ids = task.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const id of ids) {
        if (validUserIds.has(id)) {
          taskAssignmentsToMigrate++;
        } else {
          invalidTaskUserIds.add(id);
        }
      }
    }
  }

  console.log(JSON.stringify({
    totalProjects: projects.length,
    projectAssignmentsToMigrate,
    invalidProjectUserIds: Array.from(invalidProjectUserIds),
    totalTasks: tasks.length,
    taskAssignmentsToMigrate,
    invalidTaskUserIds: Array.from(invalidTaskUserIds)
  }, null, 2));

  await prisma.$disconnect();
}

analyze().catch(e => {
  console.error(e);
  process.exit(1);
});
