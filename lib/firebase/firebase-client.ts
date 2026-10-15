import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase App (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Get Firebase Messaging instance (only in browser)
let messagingInstance: Messaging | null = null

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  
  const supported = await isSupported()
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser')
    return null
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }
  return messagingInstance
}

// Request permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }

    const messaging = await getMessagingInstance()
    if (!messaging) return null

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready
    
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    return token
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
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
