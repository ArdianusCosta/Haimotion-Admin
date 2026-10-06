const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const logs = await prisma.activity_log.findMany({ take: 3, orderBy: { id: 'desc' } });
  const userIds = Array.from(new Set(logs.map(log => log.user_id)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstname: true, lastname: true, email: true, avatar: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));
  const enrichedLogs = logs.map(log => ({
    ...log,
    user: userMap.get(log.user_id) || null
  }));
  console.log(JSON.stringify(enrichedLogs, null, 2));
}
main()
