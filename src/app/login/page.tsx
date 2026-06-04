'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { getAccessToken, login, restoreSession } from '@/services/authService';
import { getChildren } from '@/services/childService';
import { getApiFieldError, getApiFormError } from '@/lib/apiErrors';
import { getParentMe, getUserMe } from '@/services/parentService';
import { AlertCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { getCountryCallingCode } from 'react-phone-number-input';
import { LegalModal, TermsOfService, PrivacyPolicy } from '@/components/LegalModal';
import { PhoneNumberField } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      if (getAccessToken()) {
        router.replace('/');
        return;
      }

      const restored = await restoreSession();
      if (!cancelled && restored?.accessToken) {
        router.replace('/');
      }
    };

    initAuth().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const form = event.currentTarget as HTMLFormElement;
      const formPhone = (form.elements.namedItem('phone_number') as HTMLInputElement | null)?.value;
      const formPassword = (form.elements.namedItem('password') as HTMLInputElement | null)?.value;

      const rawPhone = (formPhone ?? phoneNumber).trim();
      const compactPhone = rawPhone.replace(/\s+/g, '');
      const callingCode = getCountryCallingCode('ET');

      const normalizedPhone = compactPhone
        ? (compactPhone.startsWith('+')
            ? compactPhone
            : `+${callingCode}${compactPhone.replace(/^0+/g, '')}`)
        : compactPhone;

      await login({ phone_number: normalizedPhone, password: formPassword ?? password });
      await Promise.allSettled([getUserMe(), getParentMe(), getChildren()]);
      router.push('/');
    } catch (loginError) {
      setError(
        getApiFieldError(loginError, 'phone_number') ??
          getApiFieldError(loginError, 'password') ??
          getApiFormError(loginError) ??
          'Login failed. Please check your phone number and password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#1A237E] to-[#283593] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&h=1200&fit=crop&q=80"
            alt="Parent and child learning"
            fill
            priority
            quality={85}
            sizes="50vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A237E]/95 via-[#1A237E]/60 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Welcome back, parent</h2>
          <p className="max-w-md text-base text-blue-200 md:text-lg">
            Sign in to stay connected with your child&apos;s academic journey, track progress, and receive updates.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-blue-300">
            <span>Photo by</span>
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors"
            >
              Unsplash
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Parent login</h1>
              <p className="text-slate-600">Use your registered phone number to sign in.</p>
            </div>

            {error && (
              <div className="mb-6">
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
                  <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-rose-800 flex-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={onLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  Phone Number
                </label>
                <PhoneNumberField
                  id="phone"
                  name="phone_number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="9XX XXX XXX"
                  defaultCountry="ET"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 bg-slate-50 text-sm transition-all focus-within:border-[#1A237E] focus-within:bg-white"
                  inputClassName="text-[14px]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1A237E] transition-all text-sm bg-slate-50 focus:bg-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <a href="/forgot-password" className="text-sm font-medium text-[#1A237E] hover:text-blue-800 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A237E] text-white font-semibold hover:bg-blue-900 transition disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <p className="mt-6 text-center text-xs text-slate-500">
                By clicking continue, you agree to our{' '}
                <button type="button" onClick={() => setShowTerms(true)} className="underline hover:text-slate-700 font-medium">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" onClick={() => setShowPrivacy(true)} className="underline hover:text-slate-700 font-medium">
                  Privacy Policy
                </button>
                .
              </p>
            </form>
          </motion.div>
        </div>
      </div>

      <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Service">
        <TermsOfService />
      </LegalModal>

      <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy">
        <PrivacyPolicy />
      </LegalModal>
    </div>
  );
}
