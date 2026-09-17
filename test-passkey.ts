import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const passkeys = await prisma.passkey.findMany()
  console.log("Passkeys:", passkeys)
}
main().catch(console.error).finally(() => prisma.$disconnect())
