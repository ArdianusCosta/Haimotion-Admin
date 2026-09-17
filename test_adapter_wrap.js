const { prismaAdapter } = require('better-auth/adapters/prisma');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const adapter = prismaAdapter(prisma, { provider: "mysql" });

// Wrap findOne
const originalFindOne = adapter.findOne;
adapter.findOne = async (args) => {
  const result = await originalFindOne(args);
  if (result && args.model === 'user') {
    result.id = String(result.id);
  }
  return result;
};

async function main() {
  const user = await adapter.findOne({ model: 'user', where: [{ field: 'email', value: 'costa@gmail.com' }]});
  console.log('User id type:', typeof user.id, user.id);
}
main();
