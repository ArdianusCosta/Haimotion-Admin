import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import path from 'path'
import fs from 'fs'

let adminApp: App | undefined

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath)
    
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'))
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      })
      return adminApp
    }
  }

  // Fallback: try inline JSON from env
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    })
    return adminApp
  }

  throw new Error(
    'Firebase Admin: No service account found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT env var.'
  )
}

// Send push notification to specific tokens
export async function sendPushNotification({
  tokens,
  title,
  body,
  icon,
  link,
  data,
}: {
  tokens: string[]
  title: string
  body: string
  icon?: string
  link?: string
  data?: Record<string, string>
}) {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] }

  const app = getAdminApp()
  const messaging = getMessaging(app)

  const message = {
    notification: {
      title,
      body,
      ...(icon && { imageUrl: icon }),
    },
    webpush: {
      notification: {
        title,
        body,
        icon: icon || '/icon-dark-32x32.png',
        badge: '/icon-dark-32x32.png',
        ...(link && { click_action: link }),
      },
      fcmOptions: {
        link: link || '/',
      },
    },
    data: {
      ...data,
      ...(link && { link }),
      title,
      body,
    },
  }

  const invalidTokens: string[] = []
  let successCount = 0
  let failureCount = 0

  // Send to each token individually (sendEachForMulticast)
  const response = await messaging.sendEachForMulticast({
    ...message,
    tokens,
  })

  response.responses.forEach((resp, idx) => {
    if (resp.success) {
      successCount++
    } else {
      failureCount++
      // If token is invalid/expired, mark for cleanup
      if (
        resp.error?.code === 'messaging/invalid-registration-token' ||
        resp.error?.code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[idx])
      }
      console.error(`FCM send error for token ${idx}:`, resp.error?.message)
    }
  })

  return { successCount, failureCount, invalidTokens }
}

// Send to a single token
export async function sendPushToUser({
  token,
  title,
  body,
  icon,
  link,
  data,
}: {
  token: string
  title: string
  body: string
  icon?: string
  link?: string
  data?: Record<string, string>
}) {
  return sendPushNotification({
    tokens: [token],
    title,
    body,
    icon,
    link,
    data,
  })
}
