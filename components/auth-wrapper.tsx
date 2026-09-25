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
    console.log("AuthWrapper: serverUser is null but client session exists. Trusting client session.");
    // We do NOT sign out here because Next.js RSC caching can sometimes cause serverUser to be null
    // while the client has a fresh valid session.
  }

  const activeUser = serverUser ? serverUser : session?.user;

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
