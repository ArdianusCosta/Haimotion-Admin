const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const sa = require('../lib/firebase/service-account.json');

async function testSend() {
  const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApps()[0];
  const messaging = getMessaging(app);

  const token = 'fh3lZGzg61XLjFCXvb7YTL:APA91bHeuIRV59Y5OpRts4cc0UTJR3uyoUDzFEEn-WBjyNnHJmXcHmOSGPBQ6SnTtAI3naSR0ZqsdO_ikPAKIXB1g0OMefhAMphLigLeLRNzZBh7phEGPIE';

  const response = await messaging.send({
    token,
    notification: {
      title: '🔔 Tes Notifikasi HaiMotion',
      body: 'Ini tes notifikasi ke perangkat kamu! Berhasil masuk!',
    },
    webpush: {
      notification: {
        title: '🔔 Tes Notifikasi HaiMotion',
        body: 'Ini tes notifikasi ke perangkat kamu! Berhasil masuk!',
        icon: '/icon-dark-32x32.png',
      },
    },
  });

  console.log('FCM SEND SUCCESS! Message ID:', response);
}

testSend().catch(console.error);
