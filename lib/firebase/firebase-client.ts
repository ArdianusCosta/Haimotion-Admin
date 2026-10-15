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
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notification API not supported')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied or dismissed')
      return null
    }

    const messaging = await getMessagingInstance()
    if (!messaging) {
      console.warn('FCM messaging instance unavailable (possibly insecure HTTP or unsupported browser)')
      return null
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready
    
    const vapidKey = (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BGazwxJw7-a833dUiOTpBH5LRuEbTmjWziCNFcqP9DKsTQMw4n3GTjGiaPu-AMqScxR3qwAviGLI71WTUlQfUVA').trim()
    
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    return token
  } catch (error) {
    console.error('Error getting notification permission / token:', error)
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
