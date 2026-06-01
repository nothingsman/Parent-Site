'use client';

import { FormEvent, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { getAccessToken, login, restoreSession } from '@/services/authService';
import { getChildren } from '@/services/childService';
import { getApiFieldError, getApiFormError } from '@/lib/apiErrors';
import { getParentMe, getUserMe } from '@/services/parentService';
import { AlertCircle, Loader2, Lock, Eye, EyeOff, Search, X } from 'lucide-react';
import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  type Country,
} from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import { LegalModal, TermsOfService, PrivacyPolicy } from '@/components/LegalModal';

function getCountryLabel(country: Country) {
  return en[country] ?? country;
}

function CountryPicker({
  country,
  onChange,
  disabled,
}: {
  country: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const countries = useMemo(() => {
    return getCountries()
      .filter((c): c is Country => isSupportedCountry(c))
      .map((c) => {
        const name = getCountryLabel(c);
        const code = getCountryCallingCode(c);
        return { country: c, name, code };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (`+${c.code}`).includes(q)
      );
    });
  }, [countries, deferredQuery]);

  const active = useMemo(() => {
    const code = getCountryCallingCode(country);
    return {
      country,
      name: getCountryLabel(country),
      code,
    };
  }, [country]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white/0 hover:bg-white/50 transition border border-transparent focus:outline-none focus:ring-2 focus:ring-[#1A237E]/20 disabled:opacity-60"
        aria-label="Select country"
      >
        <span className="text-xs font-bold text-slate-700">{active.country}</span>
        <span className="text-xs font-semibold text-slate-500">+{active.code}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl bg-white shadow-2xl border border-slate-200"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900">Select country</h2>
                  <p className="text-xs text-slate-500 truncate">{active.name} (+{active.code})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by country or code…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#1A237E] focus:bg-white text-sm"
                  />
                </div>

                <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-slate-100">
                  {filtered.map((c) => (
                    <button
                      key={c.country}
                      type="button"
                      onClick={() => {
                        onChange(c.country);
                        setOpen(false);
                      }}
                      className={
                        'w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 ' +
                        (c.country === country ? 'bg-[#f0f4ff]' : '')
                      }
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.country}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-700 shrink-0">+{c.code}</div>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-slate-500">No matches.</div>
                  )}
                </div>
              </div>

              <div className="h-[env(safe-area-inset-bottom)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<Country>('ET');
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

  function onCountryChange(next: Country) {
    setCountry(next);
  }

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const form = event.currentTarget as HTMLFormElement;
      const formPhone = (form.elements.namedItem('phone_number') as HTMLInputElement | null)?.value;
      const formPassword = (form.elements.namedItem('password') as HTMLInputElement | null)?.value;

      const rawPhone = (formPhone ?? phoneNumber).trim();
      const compactPhone = rawPhone.replace(/\s+/g, "");
      const callingCode = getCountryCallingCode(country);

      const normalizedPhone = compactPhone
        ? (compactPhone.startsWith("+")
            ? compactPhone
            : "+" + callingCode + compactPhone.replace(/^0+/g, ""))
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
                <div className="relative">
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm transition-all focus-within:border-[#1A237E] focus-within:bg-white">
                    <div className="flex items-center gap-2">
                      <CountryPicker country={country} onChange={onCountryChange} disabled={isSubmitting} />
                      <div className="h-6 w-px bg-slate-200" />
                      <input
                        id="phone"
                        name="phone_number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9XX XXX XXX"
                        disabled={isSubmitting}
                        className="min-w-0 w-full bg-transparent outline-none border-none text-[14px] font-inherit py-2.5 pr-2"
                      />
                    </div>
                  </div>
                </div>
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
