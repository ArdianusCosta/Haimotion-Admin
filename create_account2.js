const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();
async function main() {
  const now = new Date();
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: 75,
      accountId: 'costa@gmail.com',
      providerId: 'credential',
      password: '$2y$10$G8ecP4sMdC3q.8QtczdDMeXRnE5pPZIrOlMmp4u79pBrQ6aG6aK8.', // bcrypt hash for costa@gmail.com
      createdAt: now,
      updatedAt: now
    }
  });
  console.log('Account created for 75');
}
main();
