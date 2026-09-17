const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task_list.findMany({
    orderBy: { date_created: 'desc' },
    take: 1,
    include: { assignees: true }
  });
  
  const users = await prisma.user.findMany({
    select: { id: true, firstname: true, lastname: true, avatar: true }
  })
  
  const formattedUsers = users.map(u => ({
    id: u.id,
    name: `${u.firstname} ${u.lastname || ''}`.trim(),
    initials: `${u.firstname?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase(),
    avatar: u.avatar
  }))
  
  const formattedTasks = tasks.map(task => {
    const assignedIds = task.assignees.map(a => a.user_id)
    const assignees = formattedUsers.filter(u => assignedIds.includes(u.id))
    
    return {
      id: task.id.toString(),
      title: task.task,
      assignedIds,
      assignees
    }
  })
  
  console.log(JSON.stringify(formattedTasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
