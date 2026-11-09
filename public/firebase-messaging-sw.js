// Firebase Messaging Service Worker
// This file MUST be in /public/ directory
// Note: Service workers cannot access process.env, so Firebase config is hardcoded here.

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

// Handle background messages (when browser tab is not active / device locked)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

  const isCall = payload.data?.type === 'call_incoming' || payload.data?.type === 'call' || payload.data?.is_call === 'true'
  const notificationTitle = payload.notification?.title || payload.data?.title || (isCall ? 'Panggilan Masuk' : 'HaiMotion')
  const notificationBody = payload.notification?.body || payload.data?.body || (isCall ? 'Panggilan masuk di HaiMotion Messenger' : '')
  
  // Custom vibration for calls (ringing rhythm) vs regular alerts
  const vibratePattern = isCall 
    ? [500, 200, 500, 200, 700, 300, 700]
    : [200, 100, 200]

  const link = payload.data?.link || payload.fcmOptions?.link || (isCall ? `/messenger?call=${payload.data?.room_name || ''}&type=${payload.data?.call_type || 'voice'}` : '/')

  const notificationOptions = {
    body: notificationBody,
    icon: payload.notification?.icon || payload.data?.icon || '/icon-dark-32x32.png',
    badge: '/icon-dark-32x32.png',
    tag: isCall ? `call-${payload.data?.room_name || 'incoming'}` : (payload.data?.type || 'general'),
    renotify: true,
    requireInteraction: isCall ? true : false,
    vibrate: vibratePattern,
    data: {
      link,
      isCall,
      roomName: payload.data?.room_name,
      callType: payload.data?.call_type,
      ...payload.data,
    },
    actions: isCall ? [
      { action: 'answer', title: 'Jawab Panggilan' },
      { action: 'decline', title: 'Tolak' },
    ] : [
      { action: 'open', title: 'Buka' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss' || event.action === 'decline') return

  const link = event.notification?.data?.link || '/messenger'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open at the origin, focus and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if ('navigate' in client) {
            client.navigate(link)
          }
          return
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(link)
      }
    })
  )
})
