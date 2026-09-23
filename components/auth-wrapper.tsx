'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from './login-page'
import HaiMotionDashboard from './northstar-dashboard'
import { LanguageProvider } from './language-provider'
import { authClient } from '@/lib/auth/client'

export function AuthWrapper({ initialSection = 'Dashboard', slug, serverUser }: { initialSection?: string, slug?: string[], serverUser?: any }) {
  const { data: session, isPending } = authClient.useSession();
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isPending) return null
  console.log("AuthWrapper render:", { serverUser, sessionUser: session?.user });
  
  if (serverUser === null && session) {
    console.log("AuthWrapper forcing clear because serverUser is null but session exists!");
    // Backend says user is unauthorized (e.g. resigned), but client has a session. Force clear.
    localStorage.removeItem('auth_user');
    authClient.signOut().then(() => {
      console.log("AuthWrapper signed out, reloading...");
      window.location.reload();
    });
  }

  const activeUser = serverUser !== undefined ? serverUser : session?.user;

  if (!activeUser) {
    return <LoginPage onLogin={() => {
      window.location.reload();
    }} />
  }

  return (
    <LanguageProvider>
      <HaiMotionDashboard initialSection={initialSection} user={activeUser} slug={slug} />
    </LanguageProvider>
  )
}
