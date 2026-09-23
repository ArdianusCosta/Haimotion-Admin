const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.session.findMany();
  console.log(sessions);
  const users = await prisma.user.findMany({ take: 2 });
  console.log(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
