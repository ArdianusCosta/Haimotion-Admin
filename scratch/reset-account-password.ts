import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.findFirst({
    where: { email: 'costa@haimotion.com' }
  });
  
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("User ID:", user.id);
  
  // better-auth uses the account table for passwords
  const updateResult = await prisma.account.updateMany({
    where: { userId: user.id },
    data: { password: hash }
  });
  
  console.log("Updated accounts:", updateResult.count);
  
  if (updateResult.count === 0) {
    // If no account exists, we might need to create one
    console.log("No account found! Creating one for credential login...");
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id.toString(),
        providerId: 'credential',
        password: hash
      }
    });
    console.log("Created credential account.");
  }

  // Also update user table just in case legacy code checks it
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash }
  });
  
  console.log("Password reset complete. You can now login with password123")
}

main().finally(() => prisma.$disconnect())
