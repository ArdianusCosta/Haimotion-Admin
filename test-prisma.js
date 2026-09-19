const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const fields = Object.keys(prisma._baseDmmf.modelMap.FinanceAccount.fields.reduce((acc, f) => { acc[f.name] = f; return acc; }, {}));
    console.log("FinanceAccount fields:", fields);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
