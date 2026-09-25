import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasourceUrl: process.env.POSTGRES_URL })
async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN face_descriptor TEXT;')
  console.log('Added column')
}
main().catch(console.error).finally(() => prisma.$disconnect())
