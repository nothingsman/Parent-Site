import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Providers } from './providers'
import { hasLocale } from '@/dictionaries'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Kelem Parent Portal',
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'am' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) {
    notFound();
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <div id="root">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}
