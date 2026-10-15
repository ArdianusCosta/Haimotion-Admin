import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAg0-WW4W1vIAv1LtQ07F5t9FrafeyVYhE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'haimotion-system-erp.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'haimotion-system-erp',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'haimotion-system-erp.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '500400584470',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:500400584470:web:c92a64ea5f7124d91ac237',
}

// Initialize Firebase App (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Get Firebase Messaging instance (only in browser)
let messagingInstance: Messaging | null = null

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  
  const supported = await isSupported()
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser environment')
    return null
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }
  return messagingInstance
}

// Request permission and get FCM token
export async function requestNotificationPermission(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Akses window tidak tersedia (SSR)')
  }

  // 1. Check secure context (HTTPS / localhost)
  if (!window.isSecureContext) {
    throw new Error('Push notifikasi HP WAJIB via HTTPS atau localhost. Browser HP memblokir notifikasi pada koneksi HTTP biasa (misal IP 192.168.x.x).')
  }

  // 2. Check browser API support
  if (!('Notification' in window)) {
    throw new Error('Browser di perangkat ini tidak mendukung Notification API.')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Browser di perangkat ini tidak mendukung Service Worker.')
  }

  // 3. Special check for iOS
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
  if (isIOS && !isStandalone) {
    throw new Error('Di iPhone/iPad (iOS), buka web di Safari lalu tekan tombol Share -> "Tambahkan ke Layar Utama" (Add to Home Screen) agar notifikasi bisa aktif.')
  }

  // 4. Request notification permission
  const permission = await Notification.requestPermission()
  if (permission === 'denied') {
    throw new Error('Izin notifikasi diblokir di browser. Buka setelan izin situs di browser untuk mengaktifkannya.')
  }
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi belum diizinkan atau ditutup.')
  }

  // 5. Initialize Firebase Messaging
  const messaging = await getMessagingInstance()
  if (!messaging) {
    throw new Error('Firebase Messaging tidak didukung di browser ini atau koneksi tidak aman.')
  }

  // 6. Register service worker
  let registration: ServiceWorkerRegistration
  try {
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready
  } catch (swErr: any) {
    throw new Error(`Gagal mendaftarkan Service Worker: ${swErr?.message || swErr}`)
  }

  // 7. Get FCM token
  const vapidKey = (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BGazwxJw7-a833dUiOTpBH5LRuEbTmjWziCNFcqP9DKsTQMw4n3GTjGiaPu-AMqScxR3qwAviGLI71WTUlQfUVA').trim()

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    if (!token) {
      throw new Error('Firebase tidak mengembalikan token push notification.')
    }

    return token
  } catch (tokenErr: any) {
    throw new Error(`Gagal mendapatkan token FCM: ${tokenErr?.message || tokenErr}`)
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  getMessagingInstance().then((messaging) => {
    if (messaging) {
      onMessage(messaging, callback)
    }
  })
}

export { app }
