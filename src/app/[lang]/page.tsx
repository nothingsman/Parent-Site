import { ClientOnly } from './client'
import { getDictionary, Locale } from '@/dictionaries'

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return <ClientOnly dict={dict} />
}
