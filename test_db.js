const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.account.findMany({ where: { userId: 75 } });
  console.log(accounts);
}
main();
