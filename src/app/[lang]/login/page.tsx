import { getDictionary, Locale } from '@/dictionaries';
import LoginClient from './LoginClient';

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return <LoginClient dict={dict} />;
}
