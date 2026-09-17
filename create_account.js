const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.account.create({
    data: {
      userId: 75,
      accountId: 'costa@gmail.com',
      providerId: 'credential',
      password: '$2y$10$G8ecP4sMdC3q.8QtczdDMeXRnE5pPZIrOlMmp4u79pBrQ6aG6aK8.' // bcrypt hash for costa@gmail.com
    }
  });
  console.log('Account created');
}
main();
