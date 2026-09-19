import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const acc = await prisma.financeAccount.findFirst({
      select: { id: true, code: true, name: true }
    });
    console.log("Success! Prisma knows about 'code':", acc);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
