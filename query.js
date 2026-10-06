const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const logs = await prisma.activity_log.findMany({ take: 5, orderBy: { id: 'desc' } })
  console.log(JSON.stringify(logs, null, 2))
  const users = await prisma.user.findMany({ take: 5 })
  console.log(JSON.stringify(users, null, 2))
}
main()
