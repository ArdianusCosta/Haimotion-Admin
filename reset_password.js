const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { id: 75 },
    data: { password: hash }
  });
  
  const accounts = await prisma.account.findMany({
    where: { userId: 75, providerId: 'credential' }
  });
  
  for (const acc of accounts) {
    await prisma.account.update({
      where: { id: acc.id },
      data: { password: hash }
    });
  }
  
  console.log('Password reset to password123');
}
main();
