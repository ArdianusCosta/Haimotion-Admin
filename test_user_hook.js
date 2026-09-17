const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async $allOperations({ operation, args, query }) {
        const result = await query(args);
        if (result && typeof result === 'object' && 'id' in result && result.accounts) {
           // It's likely Better Auth's includeAccounts query!
           result.id = String(result.id);
        }
        return result;
      }
    }
  }
});
async function main() {
  const user = await prisma.user.findFirst({ where: { id: 75 }, include: { accounts: true } });
  console.log(typeof user.id);
}
main();
