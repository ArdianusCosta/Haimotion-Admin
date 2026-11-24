'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from './login-page'
import HaiMotionDashboard from './northstar-dashboard'
import { LanguageProvider } from './language-provider'
import { authClient } from '@/lib/auth/client'
import { FirebaseInitializer } from './firebase-initializer'

export function AuthWrapper({ initialSection = 'Dashboard', slug, serverUser }: { initialSection?: string, slug?: string[], serverUser?: any }) {
  const { data: session, isPending } = authClient.useSession();
  const [mounted, setMounted] = useState(false)
  const [localUser, setLocalUser] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  // If serverUser is provided, that is our authoritative source with full permissions
  // If serverUser is null and isPending is false, check if session?.user exists.
  // CRITICAL FIX: If neither serverUser nor session?.user exists (or if serverUser was explicitly passed as null/undefined),
  // do NOT trust stale localUser from localStorage alone, because its session on the server has expired
  // and it lacks role.permissions.
  const hasValidSession = Boolean(serverUser || session?.user);
  const activeUser = serverUser || (session?.user ? (localUser || session.user) : null);

  useEffect(() => {
    // If the client has loaded and confirmed there is NO valid session at all,
    // clear the stale local storage so the user doesn't get stuck in a ghost session
    if (mounted && !isPending && !hasValidSession && localUser) {
      localStorage.removeItem('auth_user');
      setLocalUser(null);
    }
  }, [mounted, isPending, hasValidSession, localUser]);

  useEffect(() => {
    if (activeUser && activeUser.status === 'resign') {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_state')
      setErrorMessage('Anda sudah resign mohon hubungi admin')
      setLocalUser(null)
      authClient.signOut().catch(console.error)
    } else if (activeUser && activeUser.id) {
      const pendingOauth = localStorage.getItem('pending_oauth_login');
      if (pendingOauth) {
        localStorage.removeItem('pending_oauth_login');
        const userDisplayName = activeUser.name || `${activeUser.firstname || ''} ${activeUser.lastname || ''}`.trim() || activeUser.email;
        fetch('/api/activity-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityType: 'login',
            description: `User ${userDisplayName} logged in via Google`,
            userId: activeUser.id
          })
        }).catch(console.error);
      }
    }
  }, [activeUser])

  if (!mounted || isPending) return null

  if (!activeUser || activeUser.status === 'resign') {
    return <LoginPage initialError={errorMessage || (activeUser?.status === 'resign' ? 'Anda sudah resign mohon hubungi admin' : undefined)} onLogin={() => {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          if (u.status === 'resign') {
            setErrorMessage('Anda sudah resign mohon hubungi admin')
            localStorage.removeItem('auth_user')
            authClient.signOut().catch(console.error)
            return
          }
          setLocalUser(u)
        } catch (e) {}
      }
      window.location.reload();
    }} />
  }

  return (
    <LanguageProvider>
      <FirebaseInitializer userId={activeUser?.id} />
      <HaiMotionDashboard initialSection={initialSection} user={activeUser} slug={slug} />
    </LanguageProvider>
  )
}
