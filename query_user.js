const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findUnique({ where: { id: 66 } })
  console.log("User 66:", user)
}
main()
