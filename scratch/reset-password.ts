import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.updateMany({
    where: { email: 'costa@haimotion.com' },
    data: { password: hash }
  })
  console.log("Password updated to 'password123' for costa@haimotion.com")
}

main().finally(() => prisma.$disconnect())
