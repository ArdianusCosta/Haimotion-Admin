import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role_id: true, role: true } })
  console.log(users)
}
main().finally(() => prisma.$disconnect())
