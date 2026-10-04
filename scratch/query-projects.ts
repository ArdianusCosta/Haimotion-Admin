import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.project_list.count()
  const p = await prisma.project_list.findFirst()
  console.log("Count:", count, p)
}
main().finally(() => prisma.$disconnect())
