import { PrismaClient } from "@prisma/client"
import { prismaAdapter } from "better-auth/adapters/prisma"

const p = new PrismaClient()
const adapter = prismaAdapter(p, { provider: "mysql" })
adapter({}).then(async (ctx) => {
  const result = await ctx.findOne({
    model: "passkey",
    where: [{ field: "credentialID", value: "xzh2ydKnDvRkXwBHIIg2Tg" }]
  });
  console.log("Result:", result);
  p.$disconnect();
});
