const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, password: true } });
  const now = new Date();
  let created = 0;
  for (const user of users) {
    const existing = await prisma.account.findFirst({ where: { userId: user.id, providerId: 'credential' } });
    if (!existing) {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          accountId: user.email,
          providerId: 'credential',
          password: user.password,
          createdAt: now,
          updatedAt: now
        }
      });
      created++;
    }
  }
  console.log(`Migrated ${created} accounts`);
}
main();
