import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Outfit } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from './providers'
import { LanguageProvider } from '@/lib/i18n'
import { ServiceWorkerRegistration } from './service-worker-registration'

const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://kelem.edu'),
  title: {
    default: 'Kelem Parent Portal',
    template: '%s | Kelem Parent',
  },
  description: 'Parent portal for attendance, grades, assignments, planner, and school communication.',
  applicationName: 'Kelem Parent',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: [
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kelem Parent',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Kelem Parent Portal',
    description: 'Parent portal for attendance, grades, assignments, planner, and school communication.',
    url: 'https://kelem.edu',
    siteName: 'Kelem',
    locale: 'en_US',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A237E',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fontSans.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 font-sans text-slate-900" suppressHydrationWarning>
        <div id="root">
          <LanguageProvider>
            <Providers>
              {children}
            </Providers>
          </LanguageProvider>
        </div>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
