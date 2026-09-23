'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, Command, Mail, AlertCircle, Fingerprint, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react'
import { authClient } from '@/lib/auth/client'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState<'login' | 'forgot-password'>('login')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      console.log("Attempting sign in with email:", email);
      const { data, error: authError } = await authClient.signIn.email({
          email,
          password,
      });
      console.log("Sign in response:", { data, authError });
      
      if (authError) {
        console.error("Auth error:", authError);
        setError(authError.message || 'Invalid credentials. Please try again.')
      } else if (data) {
        console.log("Login successful, user data:", data.user);
        if ((data.user as any).status === 'resign') {
          await authClient.signOut()
          setError('Anda sudah resign mohon hubungi admin')
          return
        }
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        localStorage.setItem('play_welcome_voice', 'true')
        onLogin()
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const { error: resetError } = await authClient.forgetPassword({
        email,
        redirectTo: window.location.origin + '/reset-password'
      })
      if (resetError) {
        setError(resetError.message || 'Failed to send reset link.')
      } else {
        setSuccessMsg('Tautan reset password telah dikirim ke email Anda.')
        setTimeout(() => setView('login'), 3000)
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-[#0a0a0a] text-foreground relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {[
          { top: '5%', left: '10%', size: 'w-32 md:w-48', duration: '45s' },
          { top: '15%', right: '10%', size: 'w-40 md:w-56', duration: '55s' },
          { top: '45%', left: '5%', size: 'w-24 md:w-40', duration: '35s' },
          { top: '55%', right: '5%', size: 'w-32 md:w-52', duration: '40s' },
          { bottom: '10%', left: '20%', size: 'w-36 md:w-60', duration: '60s' },
          { bottom: '15%', right: '25%', size: 'w-28 md:w-48', duration: '50s' },
          { top: '35%', left: '35%', size: 'w-64 md:w-96', duration: '80s', opacity: 'opacity-10' },
        ].map((pos, i) => (
          <img
            key={i}
            src="/footer.png"
            alt=""
            className={`absolute object-contain opacity-20 animate-spin ${pos.size} ${pos.opacity || ''}`}
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              bottom: pos.bottom,
              animationDuration: pos.duration,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md p-6 sm:p-10 z-10 relative animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl mb-4 shadow-lg shadow-primary/25 overflow-hidden bg-background">
            <img src="/logohm.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access your workspace</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 animate-in slide-in-from-top-2 fade-in">
            <AlertCircle className="size-5 shrink-0" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-500 animate-in slide-in-from-top-2 fade-in">
            <AlertCircle className="size-5 shrink-0" />
            <p className="leading-snug">{successMsg}</p>
          </div>
        )}

        {view === 'forgot-password' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-in slide-in-from-right-4 fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70 mt-6 shadow-sm"
            >
              {isLoading ? (
                <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <><KeyRound className="size-4" /> Send Reset Link</>
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
              className="w-full flex items-center justify-center gap-2 mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> Back to Login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4 animate-in slide-in-from-left-4 fade-in">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <button type="button" onClick={() => { setView('forgot-password'); setError(''); setSuccessMsg(''); }} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70 mt-6 shadow-sm"
          >
            {isLoading ? (
              <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>Sign in <ArrowRight className="size-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="mt-6">
          <button 
            onClick={async () => {
              setIsPasskeyLoading(true)
              setError('')
              try {
                const { data, error: authError } = await authClient.signIn.passkey()
                if (authError) {
                  setError(authError.message || 'Passkey authentication failed.')
                } else if (data) {
                  if ((data.user as any).status === 'resign') {
                    await authClient.signOut()
                    setError('Anda sudah resign mohon hubungi admin')
                    return
                  }
                  localStorage.setItem('auth_user', JSON.stringify(data.user))
                  onLogin()
                }
              } catch (err) {
                setError('Network error or passkey cancelled.')
              } finally {
                setIsPasskeyLoading(false)
              }
            }}
            disabled={isPasskeyLoading || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors shadow-sm disabled:opacity-70"
          >
            {isPasskeyLoading ? (
              <span className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <><Fingerprint className="size-4" /> Sign in with Passkey</>
            )}
          </button>
        </div>
        </>
        )}

      </div>
    </div>
  )
}
