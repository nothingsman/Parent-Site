'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  completeParentInvitation,
  requestInvitationOtp,
  verifyInvitationOtp,
} from '@/services/authService';
import { getApiFieldError, getApiFormError } from '@/lib/apiErrors';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

type ParentInvitationActivationProps = {
  token: string | null | undefined;
  uid: string | null | undefined;
};

type Step = 'otp' | 'password';

type FieldErrors = {
  otp_code?: string;
  new_password?: string;
  confirm_password?: string;
  uid?: string;
  token?: string;
  invitation_verification_token?: string;
};

export function ParentInvitationActivation({
  uid,
  token,
}: ParentInvitationActivationProps) {
  const router = useRouter();
  const hasInvitation = Boolean(uid && token);
  const didAutoRequest = useRef(false);
  const [step, setStep] = useState<Step>('otp');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const invitationError = useMemo(
    () => (!hasInvitation
      ? 'Missing invitation link details. Please use the full link from your invitation.'
      : null),
    [hasInvitation],
  );

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => {
      router.replace('/login');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [router, success]);

  function resetErrors() {
    setFormError(null);
    setFieldErrors({});
  }

  async function sendOtpRequest() {
    resetErrors();
    setMessage(null);

    if (!hasInvitation) return;

    setIsRequestingOtp(true);
    try {
      const response = await requestInvitationOtp({
        uid: uid!,
        token: token!,
      });
      setStep('otp');
      setOtpCode('');
      setVerificationToken('');
      setMessage(response.message);
    } catch (error) {
      setFieldErrors({
        uid: getApiFieldError(error, 'uid') ?? undefined,
        token: getApiFieldError(error, 'token') ?? undefined,
      });
      setFormError(
        getApiFormError(error)
        ?? getApiFieldError(error, 'uid')
        ?? getApiFieldError(error, 'token')
        ?? 'Failed to send OTP. Please retry from the invitation link.',
      );
    } finally {
      setIsRequestingOtp(false);
    }
  }

  useEffect(() => {
    if (!hasInvitation || didAutoRequest.current) return;
    didAutoRequest.current = true;
    void sendOtpRequest();
  }, [hasInvitation]);

  async function onVerifyOtp(event: FormEvent) {
    event.preventDefault();
    resetErrors();
    setMessage(null);

    if (!hasInvitation) return;

    setIsVerifyingOtp(true);
    try {
      const response = await verifyInvitationOtp({
        uid: uid!,
        token: token!,
        otp_code: otpCode.trim(),
      });
      setVerificationToken(response.invitation_verification_token);
      setStep('password');
      setOtpCode('');
      setMessage(response.message);
    } catch (error) {
      setFieldErrors({
        otp_code: getApiFieldError(error, 'otp_code') ?? undefined,
        uid: getApiFieldError(error, 'uid') ?? undefined,
        token: getApiFieldError(error, 'token') ?? undefined,
      });
      setFormError(
        getApiFormError(error)
        ?? getApiFieldError(error, 'otp_code')
        ?? getApiFieldError(error, 'uid')
        ?? getApiFieldError(error, 'token')
        ?? 'OTP verification failed. Please try again.',
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function onCompleteInvitation(event: FormEvent) {
    event.preventDefault();
    resetErrors();
    setMessage(null);

    if (!hasInvitation) return;

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await completeParentInvitation({
        uid: uid!,
        token: token!,
        new_password: newPassword,
        invitation_verification_token: verificationToken,
      });
      setSuccess(true);
      setMessage(response.message);
    } catch (error) {
      setFieldErrors({
        new_password: getApiFieldError(error, 'new_password') ?? undefined,
        uid: getApiFieldError(error, 'uid') ?? undefined,
        token: getApiFieldError(error, 'token') ?? undefined,
        invitation_verification_token: getApiFieldError(error, 'invitation_verification_token') ?? undefined,
      });
      setFormError(
        getApiFormError(error)
        ?? getApiFieldError(error, 'invitation_verification_token')
        ?? getApiFieldError(error, 'uid')
        ?? getApiFieldError(error, 'token')
        ?? 'Activation failed. Please review the form and try again.',
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
        className="relative z-10 w-full max-w-[460px]"
      >
        <div className="rounded-[2rem] border border-slate-200 bg-white/70 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-900 to-blue-600 shadow-lg shadow-indigo-900/20">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="bg-gradient-to-r from-indigo-900 to-blue-600 bg-clip-text text-2xl leading-tight font-black tracking-tight text-transparent uppercase">
                Kelem Co.
              </h2>
              <p className="mt-1 text-xs font-bold tracking-widest text-slate-500 uppercase">
                Verify Phone And Set Password
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {invitationError ? (
              <motion.div key="missing-invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span className="leading-relaxed">{invitationError}</span>
                </div>
              </motion.div>
            ) : success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-500 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">
                  {message ?? 'Password set. Redirecting to login...'}
                </p>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-5 text-center text-xs leading-relaxed font-medium text-slate-500">
                  {step === 'otp'
                    ? 'We sent a verification code to the phone number attached to your invitation. Enter the code to continue.'
                    : 'Create your password to finish activating your parent account.'}
                </div>

                {formError ? (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="leading-relaxed">{formError}</span>
                  </div>
                ) : null}

                {message ? (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="leading-relaxed">{message}</span>
                  </div>
                ) : null}

                {step === 'otp' ? (
                  <form className="space-y-5" onSubmit={onVerifyOtp}>
                    <div className="space-y-1.5">
                      <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">OTP Code</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value)}
                        placeholder="123456"
                        disabled={isRequestingOtp || isVerifyingOtp}
                        required
                      />
                      {fieldErrors.otp_code ? <p className="pl-1 text-xs font-semibold text-red-600">{fieldErrors.otp_code}</p> : null}
                    </div>

                    <button
                      type="submit"
                      disabled={isRequestingOtp || isVerifyingOtp || !otpCode.trim()}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-900 to-blue-600 text-sm font-black tracking-wide text-white uppercase shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify OTP
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { void sendOtpRequest(); }}
                      disabled={isRequestingOtp || isVerifyingOtp}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black tracking-wide text-slate-700 uppercase transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRequestingOtp ? 'Resending...' : 'Resend OTP'}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={onCompleteInvitation}>
                    <div className="space-y-1.5">
                      <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">New Password</label>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Enter a strong password"
                        disabled={isSubmitting}
                        required
                      />
                      {fieldErrors.new_password ? <p className="pl-1 text-xs font-semibold text-red-600">{fieldErrors.new_password}</p> : null}
                    </div>

                    <div className="space-y-1.5">
                      <label className="pl-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">Confirm Password</label>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-900 focus:ring-4 focus:ring-indigo-900/10"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter your password"
                        disabled={isSubmitting}
                        required
                      />
                      {fieldErrors.confirm_password ? <p className="pl-1 text-xs font-semibold text-red-600">{fieldErrors.confirm_password}</p> : null}
                    </div>

                    {fieldErrors.invitation_verification_token ? (
                      <p className="pl-1 text-xs font-semibold text-red-600">
                        {fieldErrors.invitation_verification_token}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmitting || !verificationToken}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-900 to-blue-600 text-sm font-black tracking-wide text-white uppercase shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Set Password
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
