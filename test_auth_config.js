const { betterAuth } = require('better-auth');
const { prismaAdapter } = require('better-auth/adapters/prisma');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'mysql' }),
  user: {
    modelName: 'user',
    fields: { email: 'email', name: 'firstname', image: 'avatar' },
    additionalFields: {
      password: { type: 'string' }
    }
  },
  emailAndPassword: { enabled: true }
});

async function main() {
  const user = await auth.$context.internalAdapter.findUserByEmail('costa@gmail.com');
  console.log('User found:', !!user);
  if (user) {
    console.log('Password on user:', user.user.password);
  }
}
main();
