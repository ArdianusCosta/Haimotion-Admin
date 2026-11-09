// Firebase Messaging Service Worker
// Location: /public/firebase-messaging-sw.js

// Ensure instant activation of updated service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Import Firebase scripts for compat mode
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

// Helper to show notification with proper vibration and action buttons
function displayNotification(title, body, data, notification) {
  const isCall = data?.type === 'call_incoming' || data?.type === 'call' || data?.is_call === 'true'
  const notifTitle = title || data?.title || (isCall ? 'Panggilan Masuk' : 'HaiMotion')
  const notifBody = body || data?.body || (isCall ? 'Panggilan masuk di HaiMotion Messenger' : '')

  const vibratePattern = isCall
    ? [500, 200, 500, 200, 700, 300, 700]
    : [200, 100, 200]

  const link = data?.link || (isCall ? `/messenger?call=${data?.room_name || ''}&type=${data?.call_type || 'voice'}` : '/')

  const options = {
    body: notifBody,
    icon: notification?.icon || data?.icon || '/icon-dark-32x32.png',
    badge: '/icon-dark-32x32.png',
    tag: isCall ? `call-${data?.room_name || 'incoming'}` : (data?.type || 'general'),
    renotify: true,
    requireInteraction: isCall ? true : false,
    vibrate: vibratePattern,
    data: {
      link,
      isCall,
      roomName: data?.room_name,
      callType: data?.call_type,
      ...data,
    },
    actions: isCall ? [
      { action: 'answer', title: 'Jawab Panggilan' },
      { action: 'decline', title: 'Tolak' },
    ] : [
      { action: 'open', title: 'Buka' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  }

  return self.registration.showNotification(notifTitle, options)
}

// 1. Native Push Event Listener (CRITICAL FOR BACKGROUND WAKEUP ON ANDROID & PWA)
// Without event.waitUntil(showNotification), Android kills the background worker and delays the alert until app opens!
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received in background:', event)
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch (e) {
      payload = { notification: { title: 'HaiMotion', body: event.data.text() } }
    }
  }

  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || data.title
  const body = notification.body || data.body

  event.waitUntil(displayNotification(title, body, data, notification))
})

// 2. Firebase onBackgroundMessage fallback
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Firebase onBackgroundMessage received:', payload)
  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || data.title
  const body = notification.body || data.body

  return displayNotification(title, body, data, notification)
})

// 3. Handle notification click (open/focus app directly to call or chat)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss' || event.action === 'decline') return

  const link = event.notification?.data?.link || '/messenger'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if ('navigate' in client) {
            client.navigate(link)
          }
          return
        }
      }
      // Open new window if app was closed
      if (clients.openWindow) {
        return clients.openWindow(link)
      }
    })
  )
})
