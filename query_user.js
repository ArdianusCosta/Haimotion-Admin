const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const bcrypt = require('bcryptjs')
  const newHash = await bcrypt.hash('costa123', 10)
  const updatedUser = await prisma.user.update({
    where: { email: 'costa@gmail.com' },
    data: { password: newHash }
  })
  console.log("Updated costa@gmail.com password!")
}
main()
