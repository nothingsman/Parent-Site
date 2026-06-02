import type { Metadata } from 'next'
import { JetBrains_Mono, Outfit } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from './providers'
import { LanguageProvider } from '@/lib/i18n'

const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Kelem Parent Portal',
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
      </body>
    </html>
  )
}
