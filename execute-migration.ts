import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration...');

  // 1. Migrate project_list to ProjectMember
  const projects = await prisma.project_list.findMany({ select: { id: true, user_ids: true } });
  let projectAssignments = 0;

  for (const project of projects) {
    if (project.user_ids) {
      const ids = project.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const userId of ids) {
        try {
          await prisma.projectMember.upsert({
            where: {
              project_id_user_id: {
                project_id: project.id,
                user_id: userId
              }
            },
            update: {},
            create: {
              project_id: project.id,
              user_id: userId
            }
          });
          projectAssignments++;
        } catch (e) {
          console.error(`Error inserting ProjectMember for project ${project.id}, user ${userId}:`, e);
        }
      }
    }
  }
  console.log(`Migrated ${projectAssignments} project assignments.`);

  // 2. Migrate task_list to TaskAssignee
  const tasks = await prisma.task_list.findMany({ select: { id: true, user_ids: true } });
  let taskAssignments = 0;

  for (const task of tasks) {
    if (task.user_ids) {
      const ids = task.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const userId of ids) {
        try {
          await prisma.taskAssignee.upsert({
            where: {
              task_id_user_id: {
                task_id: task.id,
                user_id: userId
              }
            },
            update: {},
            create: {
              task_id: task.id,
              user_id: userId
            }
          });
          taskAssignments++;
        } catch (e) {
          console.error(`Error inserting TaskAssignee for task ${task.id}, user ${userId}:`, e);
        }
      }
    }
  }
  console.log(`Migrated ${taskAssignments} task assignments.`);

  await prisma.$disconnect();
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
