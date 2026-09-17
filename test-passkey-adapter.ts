import { PrismaClient } from '@prisma/client'
import { auth } from './lib/auth/auth'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("No users found.")
    return
  }
  console.log("User:", user.id)

  try {
    const res = await (auth as any).$context.adapter.create({
      model: "passkey",
      data: {
        id: "test-passkey-id-2",
        name: "test",
        publicKey: "base64==",
        userId: user.id,
        credentialID: "cred-id-2",
        counter: 1,
        deviceType: "singleDevice",
        backedUp: true,
        transports: "internal",
        createdAt: new Date(),
        aaguid: "aaguid-test" // Testing if missing aaguid in schema crashes
      }
    })
    console.log("Passkey created:", res)
  } catch (err) {
    console.error("Error creating passkey:", err)
  } finally {
    await prisma.$disconnect()
  }
}
main()
