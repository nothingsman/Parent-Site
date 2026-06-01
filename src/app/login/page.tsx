'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { login } from '@/services/authService';
import { getChildren } from '@/services/childService';
import { getApiFieldError, getApiFormError } from '@/lib/apiErrors';
import { getParentMe, getUserMe } from '@/services/parentService';
import { AlertCircle, KeyRound, Loader2, LockKeyhole, Phone, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ phone_number: phoneNumber.trim(), password });
      await Promise.allSettled([getUserMe(), getParentMe(), getChildren()]);
      router.push('/');
    } catch (loginError) {
      setError(
        getApiFieldError(loginError, 'phone_number')
        ?? getApiFieldError(loginError, 'password')
        ?? getApiFormError(loginError)
        ?? 'Login failed. Please check your phone number and password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 font-sans">
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/15 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="flex flex-col items-center rounded-[2rem] border border-slate-200 bg-white/70 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-900 to-blue-600 shadow-lg shadow-indigo-900/20">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="bg-gradient-to-r from-indigo-900 to-blue-600 bg-clip-text text-2xl leading-tight font-black tracking-tight text-transparent uppercase">Kelem Co.</h2>
              <p className="mt-1 text-xs font-bold tracking-widest text-slate-500 uppercase">Parent Portal Sign In</p>
            </div>
          </div>

          {error ? (
            <div className="mb-6 flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span className="leading-relaxed">{error}</span>
            </div>
          ) : null}

          <form className="w-full space-y-5" onSubmit={onLogin}>
            <div className="space-y-1.5">
              <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-12 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+2519XXXXXXXX"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">Password</label>
              <div className="relative flex items-center">
                <LockKeyhole className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-12 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button disabled={isSubmitting} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-900 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-950 disabled:cursor-not-allowed disabled:opacity-40">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
