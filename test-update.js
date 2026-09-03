const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task_list.findMany({ take: 1 });
  if (tasks.length === 0) {
    console.log("No tasks");
    return;
  }
  const task = tasks[0];
  console.log("Updating task:", task.id, "to status:", (task.status === 2 ? 1 : 2));
  try {
    const updated = await prisma.task_list.update({
      where: { id: task.id },
      data: { status: (task.status === 2 ? 1 : 2) }
    });
    console.log("Success:", updated.status);
  } catch (err) {
    console.error("Error:", err);
  }
}

main().finally(() => prisma.$disconnect());
