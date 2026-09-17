import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Roboto, Outfit, Playfair_Display, Fira_Code, Oswald } from 'next/font/google'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'HaiMotion — Business workspace',
  description: 'A focused command center for modern teams.',
  generator: 'HaiMotion',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${roboto.variable} ${playfair.variable} ${firaCode.variable} ${oswald.variable} antialiased font-sans`}>
        <QueryProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
