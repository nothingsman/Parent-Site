'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { completeParentInvitation } from '@/services/authService';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';

function toFieldError(error: unknown, key: string): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const maybe = (error as Record<string, unknown>)[key];
  if (Array.isArray(maybe) && typeof maybe[0] === 'string') return maybe[0];
  return null;
}

export default function CompleteParentInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const uid = searchParams.get('uid');
      const token = searchParams.get('token');

      if (!uid || !token) {
        setErrorMessage('Missing invitation link details. Please use the full link from your invitation.');
        setStatus('error');
        return;
      }

      try {
        await completeParentInvitation({ uid, token });
        setStatus('success');
        setTimeout(() => router.replace('/login'), 1500);
      } catch (error) {
        const details = (error as { details?: unknown })?.details;
        const message =
          toFieldError(details, 'uid') ??
          toFieldError(details, 'token') ??
          'Invalid or expired invitation. Please contact your school.';
        setErrorMessage(message);
        setStatus('error');
      }
    }

    run();
  }, [router, searchParams]);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 font-sans">
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/15 blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 25, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative z-10 w-full max-w-[460px]">
        <div className="flex flex-col items-center rounded-[2rem] border border-slate-200 bg-white/70 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-900 to-blue-600 shadow-lg shadow-indigo-900/20">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="bg-gradient-to-r from-indigo-900 to-blue-600 bg-clip-text text-2xl leading-tight font-black tracking-tight text-transparent uppercase">Kelem Co.</h2>
              <p className="mt-1 text-xs font-bold tracking-widest text-slate-500 uppercase">Activate Parent Account</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
                <p className="text-sm font-medium text-slate-600">Activating your parent account...</p>
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">Account activated. Redirecting to OTP login...</p>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
                <p className="text-center text-xs leading-relaxed font-medium text-slate-500">Please request a new invitation or contact your school office.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
