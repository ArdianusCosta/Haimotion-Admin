// Firebase Messaging Service Worker
// This file MUST be in /public/ directory
// Note: Service workers cannot access process.env, so Firebase config is hardcoded here.
// Update these values if your Firebase project changes.

importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAg0-WW4W1vIAv1LtQ07F5t9FrafeyVYhE',
  authDomain: 'haimotion-system-erp.firebaseapp.com',
  projectId: 'haimotion-system-erp',
  storageBucket: 'haimotion-system-erp.firebasestorage.app',
  messagingSenderId: '500400584470',
  appId: '1:500400584470:web:c92a64ea5f7124d91ac237',
})

const messaging = firebase.messaging()

// Handle background messages (when browser tab is not active)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

  const notificationTitle = payload.notification?.title || payload.data?.title || 'HaiMotion'
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || payload.data?.icon || '/icon-dark-32x32.png',
    badge: '/icon-dark-32x32.png',
    tag: payload.data?.type || 'general',
    data: {
      link: payload.data?.link || payload.fcmOptions?.link || '/',
      ...payload.data,
    },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'dismiss', title: 'Tutup' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const link = event.notification?.data?.link || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(link)
          return
        }
      }
      // Otherwise, open a new window
      return clients.openWindow(link)
    })
  )
})
