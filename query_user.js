const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const accounts = await prisma.account.findMany({
    where: { userId: 75 } // Assuming userId 75 is costa@gmail.com
  })
  console.log("Accounts for costa@gmail.com:", accounts)
}
main()
