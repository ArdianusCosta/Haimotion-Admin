const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 64;
  const token = 'fh3lZGzg61XLjFCXvb7YTL:APA91bHeuIRV59Y5OpRts4cc0UTJR3uyoUDzFEEn-WBjyNnHJmXcHmOSGPBQ6SnTtAI3naSR0ZqsdO_ikPAKIXB1g0OMefhAMphLigLeLRNzZBh7phEGPIE';
  const device = 'Windows';
  const browser = 'Chrome';

  const existing = await prisma.pushSubscription.findFirst({
    where: {
      user_id: userId,
      token: token,
    },
  });

  if (existing) {
    const updated = await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        device: device || null,
        browser: browser || null,
        updated_at: new Date(),
      },
    });
    console.log('Updated subscription:', updated);
  } else {
    const created = await prisma.pushSubscription.create({
      data: {
        user_id: userId,
        token,
        device: device || null,
        browser: browser || null,
      },
    });
    console.log('Created subscription:', created);
  }

  const allSubs = await prisma.pushSubscription.findMany();
  console.log('All subscriptions in DB:', allSubs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
