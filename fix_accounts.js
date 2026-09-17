const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.account.findMany();
  for (const acc of accounts) {
    if (acc.providerId === 'credential') {
      await prisma.account.update({
        where: { id: acc.id },
        data: { accountId: String(acc.userId) }
      });
    }
  }
  console.log('Fixed account IDs');
}
main();
