const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if task 1241 has assignees in the DB
  const task = await prisma.task_list.findUnique({
    where: { id: 1241 },
    include: { assignees: true }
  });
  console.log('Task 1241 assignees from DB:', JSON.stringify(task?.assignees, null, 2));
  
  // Check how users are queried
  const users = await prisma.user.findMany({
    select: { id: true, firstname: true, lastname: true, avatar: true }
  });
  
  // Simulate getTasksData filtering
  const formattedUsers = users.map(u => ({
    id: u.id,  // This is a number (BigInt or Int from Prisma)
    name: `${u.firstname} ${u.lastname || ''}`.trim(),
  }));
  
  if (task) {
    const assignedIds = task.assignees.map(a => a.user_id);
    console.log('assignedIds:', assignedIds, 'types:', assignedIds.map(id => typeof id));
    
    const formattedUserIds = formattedUsers.map(u => u.id);
    console.log('sample formattedUser ids:', formattedUserIds.slice(0, 3), 'types:', formattedUserIds.slice(0, 3).map(id => typeof id));
    
    const matchedAssignees = formattedUsers.filter(u => assignedIds.includes(u.id));
    console.log('Matched assignees:', JSON.stringify(matchedAssignees, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
