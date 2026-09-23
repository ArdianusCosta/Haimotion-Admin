require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const latest = await prisma.session.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log("Latest session in Next.js DB:", latest);
}
main().catch(console.error).finally(() => prisma.$disconnect());
