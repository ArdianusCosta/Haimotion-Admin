const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConn() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('PRISMA_CONNECTED_OK', res);
    await prisma.$disconnect();
  } catch (err) {
    console.error('PRISMA_CONN_ERR', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}
testConn();
