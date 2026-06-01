'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { requestOtp, verifyOtp } from '@/services/authService';
import { getParentMe, getUserMe } from '@/services/parentService';
import { getChildren } from '@/services/childService';
import { AlertCircle, CheckCircle, KeyRound, Loader2, Phone, ShieldCheck } from 'lucide-react';

type Step = 'phone' | 'otp';

function toFieldError(error: unknown, key: string): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const maybe = (error as Record<string, unknown>)[key];
  if (Array.isArray(maybe) && typeof maybe[0] === 'string') return maybe[0];
  return null;
}

export default function LoginClient({ dict }: { dict: any }) {
  const RESEND_COOLDOWN_SECONDS = 30;
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const SUCCESS_MESSAGE_TIMEOUT_MS = 3000;

  useEffect(() => {
    if (resendCooldownSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldownSeconds]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      setMessage(null);
    }, SUCCESS_MESSAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!resendMessage) return undefined;
    const timer = window.setTimeout(() => {
      setResendMessage(null);
    }, SUCCESS_MESSAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [resendMessage]);

  async function onRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await requestOtp(phoneNumber.trim());
      setMessage(res.message);
      setResendMessage(null);
      setResendCooldownSeconds(0);
      setStep('otp');
    } catch (requestError) {
      setError(toFieldError((requestError as { details?: unknown })?.details, 'phone_number') ?? dict.login.failedSendOtp);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResendOtp() {
    if (isResending || resendCooldownSeconds > 0) return;
    setResendMessage(null);
    setError(null);
    setIsResending(true);
    try {
      const res = await requestOtp(phoneNumber.trim());
      setResendMessage(res.message);
      setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (resendError) {
      setError(toFieldError((resendError as { details?: unknown })?.details, 'phone_number') ?? dict.login.failedResendOtp);
    } finally {
      setIsResending(false);
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await verifyOtp({ phone_number: phoneNumber.trim(), otp_code: otpCode.trim() });
      await Promise.allSettled([getUserMe(), getParentMe(), getChildren()]);
      router.push(`/${lang}`);
    } catch (verifyError) {
      const otpFieldError = toFieldError((verifyError as { details?: unknown })?.details, 'otp_code');
      setError(otpFieldError ?? dict.login.loginFailed);
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
              <h2 className="bg-gradient-to-r from-indigo-900 to-blue-600 bg-clip-text text-2xl leading-tight font-black tracking-tight text-transparent uppercase">{dict.login.kelemCo}</h2>
              <p className="mt-1 text-xs font-bold tracking-widest text-slate-500 uppercase">{dict.login.parentPortal}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 w-full overflow-hidden">
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
            {message && (
              <motion.div key="message" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 w-full overflow-hidden">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="leading-relaxed">{message}</span>
                </div>
              </motion.div>
            )}
            {resendMessage && (
              <motion.div key="resend" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 w-full overflow-hidden">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="leading-relaxed">{resendMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'phone' ? (
            <form className="w-full space-y-5" onSubmit={onRequestOtp}>
              <div className="space-y-1.5">
                <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">{dict.login.phoneNumber}</label>
                <div className="relative flex items-center">
                  <Phone className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-12 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={dict.login.phonePlaceholder}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <button disabled={isSubmitting} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-900 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-950 disabled:cursor-not-allowed disabled:opacity-40">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>{isSubmitting ? dict.login.sending : dict.login.requestOtp}</span>
              </button>
            </form>
          ) : (
            <form className="w-full space-y-5" onSubmit={onVerifyOtp}>
              <p className="text-center text-xs leading-relaxed font-medium text-slate-500">{dict.login.otpSentTo.replace('{phoneNumber}', phoneNumber)}</p>
              <div className="space-y-1.5">
                <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">{dict.login.otpCode}</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={dict.login.otpPlaceholder}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={isResending || isSubmitting || resendCooldownSeconds > 0}
                  className="text-xs font-black tracking-wider text-indigo-900 uppercase disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isResending ? dict.login.resending : dict.login.resendOtp}
                </button>
                {resendCooldownSeconds > 0 ? <p className="text-xs text-slate-500">{dict.login.resendIn.replace('{seconds}', resendCooldownSeconds.toString())}</p> : null}
              </div>

              <button disabled={isSubmitting} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-900 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-950 disabled:cursor-not-allowed disabled:opacity-40">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>{isSubmitting ? dict.login.verifying : dict.login.verifyOtp}</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
}
