import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { ParentInvitationActivation } from './ParentInvitationActivation';

const replaceMock = vi.fn();
const requestInvitationOtpMock = vi.fn();
const verifyInvitationOtpMock = vi.fn();
const completeParentInvitationMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/services/authService', () => ({
  requestInvitationOtp: (...args: unknown[]) => requestInvitationOtpMock(...args),
  verifyInvitationOtp: (...args: unknown[]) => verifyInvitationOtpMock(...args),
  completeParentInvitation: (...args: unknown[]) => completeParentInvitationMock(...args),
}));

function setInputValue(input: Element | null | undefined, value: string) {
  const element = input as HTMLInputElement | null;
  if (!element) return;
  act(() => {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function renderActivation() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<ParentInvitationActivation uid="uid-1" token="token-1" />);
  });

  return { container, root };
}

describe('ParentInvitationActivation', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    vi.useRealTimers();
    replaceMock.mockReset();
    requestInvitationOtpMock.mockReset();
    verifyInvitationOtpMock.mockReset();
    completeParentInvitationMock.mockReset();
    requestInvitationOtpMock.mockResolvedValue({ message: 'OTP sent successfully.' });
  });

  function cleanup() {
    if (root && container) {
      act(() => {
        root?.unmount();
      });
      container.remove();
    }
    root = null;
    container = null;
  }

  it('auto-requests an OTP on load and does not render phone input', async () => {
    await act(async () => {
      ({ container, root } = renderActivation());
    });

    expect(requestInvitationOtpMock).toHaveBeenCalledWith({ uid: 'uid-1', token: 'token-1' });
    expect(container?.textContent).toContain('OTP sent successfully.');
    expect(container?.textContent).not.toContain('Phone Number');
    cleanup();
  });

  it('resends OTP from the OTP step', async () => {
    await act(async () => {
      ({ container, root } = renderActivation());
    });

    const buttons = Array.from(container?.querySelectorAll('button') ?? []);
    const resendButton = buttons.find((button) => button.textContent?.includes('Resend OTP'));

    await act(async () => {
      resendButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(requestInvitationOtpMock).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it('shows OTP request failure on the invitation page without redirecting', async () => {
    requestInvitationOtpMock.mockRejectedValue({
      details: {
        errors: [
          { field: 'token', detail: 'Invalid or expired token.' },
        ],
      },
    });

    await act(async () => {
      ({ container, root } = renderActivation());
    });

    expect(container?.textContent).toContain('Invalid or expired token.');
    expect(container?.textContent).toContain('Verify Phone And Set Password');
    expect(replaceMock).not.toHaveBeenCalled();
    cleanup();
  });

  it('verifies OTP and transitions to password step', async () => {
    verifyInvitationOtpMock.mockResolvedValue({
      message: 'OTP verified successfully.',
      invitation_verification_token: 'verify-token-1',
    });

    await act(async () => {
      ({ container, root } = renderActivation());
    });

    const otpInput = container?.querySelector('input');
    setInputValue(otpInput, '123456');

    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(verifyInvitationOtpMock).toHaveBeenCalledWith({
      uid: 'uid-1',
      token: 'token-1',
      otp_code: '123456',
    });
    expect(container?.textContent).toContain('Create your password');
    cleanup();
  });

  it('validates password confirmation before activation', async () => {
    verifyInvitationOtpMock.mockResolvedValue({
      message: 'OTP verified successfully.',
      invitation_verification_token: 'verify-token-2',
    });

    await act(async () => {
      ({ container, root } = renderActivation());
    });

    setInputValue(container?.querySelector('input'), '123456');
    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const inputs = container?.querySelectorAll('input');
    setInputValue(inputs?.[0], 'new-secure-password');
    setInputValue(inputs?.[1], 'different-password');

    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container?.textContent).toContain('Passwords do not match.');
    expect(completeParentInvitationMock).not.toHaveBeenCalled();
    cleanup();
  });

  it('submits password activation payload after OTP verification', async () => {
    verifyInvitationOtpMock.mockResolvedValue({
      message: 'OTP verified successfully.',
      invitation_verification_token: 'verify-token-3',
    });
    completeParentInvitationMock.mockResolvedValue({
      message: 'Password set and parent account activated successfully.',
    });
    vi.useFakeTimers();

    await act(async () => {
      ({ container, root } = renderActivation());
    });

    setInputValue(container?.querySelector('input'), '123456');
    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const inputs = container?.querySelectorAll('input');
    setInputValue(inputs?.[0], 'new-secure-password');
    setInputValue(inputs?.[1], 'new-secure-password');

    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(completeParentInvitationMock).toHaveBeenCalledWith({
      uid: 'uid-1',
      token: 'token-1',
      new_password: 'new-secure-password',
      invitation_verification_token: 'verify-token-3',
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(replaceMock).toHaveBeenCalledWith('/login');
    cleanup();
  });

  it('shows backend OTP and token errors on the matching step', async () => {
    verifyInvitationOtpMock.mockRejectedValue({
      details: {
        errors: [
          { field: 'otp_code', detail: 'Invalid or expired OTP code.' },
          { field: 'token', detail: 'Invalid or expired token.' },
        ],
      },
    });

    await act(async () => {
      ({ container, root } = renderActivation());
    });

    setInputValue(container?.querySelector('input'), '123456');
    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container?.textContent).toContain('Invalid or expired token.');
    expect(container?.textContent).toContain('Invalid or expired OTP code.');
    cleanup();
  });
});
