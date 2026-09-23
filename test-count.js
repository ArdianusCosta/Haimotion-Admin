const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.session.count();
  console.log("Total sessions:", count);
  const latest = await prisma.session.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log("Latest session:", latest);
}
main().catch(console.error).finally(() => prisma.$disconnect());
