import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function run() {
  const res = await p.passkey.findFirst({
    where: { credentialID: "xzh2ydKnDvRkXwBHIIg2Tg" }
  })
  console.log("findFirst result:", res)
  p.$disconnect()
}
run()
