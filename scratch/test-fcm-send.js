const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { PrismaClient } = require('@prisma/client');
const sa = require('../lib/firebase/service-account.json');

const prisma = new PrismaClient();

async function testSend() {
  const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApps()[0];
  const messaging = getMessaging(app);

  // Ambil token dari database
  const subscriptions = await prisma.pushSubscription.findMany({
    orderBy: { id: 'desc' },
  });

  if (subscriptions.length === 0) {
    console.log('Tidak ada subscription push di database.');
    return;
  }

  console.log(`Ditemukan ${subscriptions.length} perangkat terdaftar:`);
  subscriptions.forEach((s) => {
    console.log(`- ID: ${s.id} | User: ${s.user_id} | Device: ${s.device} (${s.browser})`);
  });

  for (const sub of subscriptions) {
    console.log(`\n--> Mengirim push notifikasi ke perangkat ${sub.device} (User ${sub.user_id})...`);
    try {
      const response = await messaging.send({
        token: sub.token,
        notification: {
          title: '🔔 Tes Notifikasi HaiMotion',
          body: `Halo dari HaiMotion! Pesan ini masuk ke HP ${sub.device} kamu!`,
        },
        webpush: {
          notification: {
            title: '🔔 Tes Notifikasi HaiMotion',
            body: `Halo dari HaiMotion! Pesan ini masuk ke HP ${sub.device} kamu!`,
            icon: '/icon-dark-32x32.png',
            badge: '/icon-dark-32x32.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
          },
        },
        data: {
          link: '/',
          type: 'general',
        },
      });

      console.log(`✅ BERHASIL KIRIM ke ${sub.device}! Message ID:`, response);
    } catch (err) {
      console.error(`❌ GAGAL KIRIM ke ${sub.device}:`, err.message || err);
    }
  }
}

testSend()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
