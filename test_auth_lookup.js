const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'costa@gmail.com' }
  });
  console.log('Direct Prisma lookup:', user?.id);
}
main();
