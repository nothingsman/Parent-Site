import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import LoginPage from './page';

const pushMock = vi.fn();
const loginMock = vi.fn();
const getUserMeMock = vi.fn();
const getParentMeMock = vi.fn();
const getChildrenMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/services/authService', () => ({
  login: (...args: unknown[]) => loginMock(...args),
}));

vi.mock('@/services/parentService', () => ({
  getUserMe: () => getUserMeMock(),
  getParentMe: () => getParentMeMock(),
}));

vi.mock('@/services/childService', () => ({
  getChildren: () => getChildrenMock(),
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

function renderPage() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<LoginPage />);
  });

  return { container, root };
}

describe('LoginPage', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    getUserMeMock.mockReset();
    getParentMeMock.mockReset();
    getChildrenMock.mockReset();
    getUserMeMock.mockResolvedValue({ id: 'u1' });
    getParentMeMock.mockResolvedValue({ id: 'p1' });
    getChildrenMock.mockResolvedValue([]);
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

  it('submits phone number and password', async () => {
    loginMock.mockResolvedValue({ accessToken: 'tok123' });

    ({ container, root } = renderPage());

    const inputs = container?.querySelectorAll('input');
    setInputValue(inputs?.[0], '+251911111111');
    setInputValue(inputs?.[1], 'secure-password');

    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(loginMock).toHaveBeenCalledWith({
      phone_number: '+251911111111',
      password: 'secure-password',
    });
    expect(pushMock).toHaveBeenCalledWith('/');
    cleanup();
  });

  it('shows backend validation errors', async () => {
    loginMock.mockRejectedValue({
      details: {
        errors: [{ field: 'phone_number', detail: 'No active parent account was found for this phone number.' }],
      },
    });

    ({ container, root } = renderPage());

    const inputs = container?.querySelectorAll('input');
    setInputValue(inputs?.[0], '+251900000000');
    setInputValue(inputs?.[1], 'bad-password');

    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container?.textContent).toContain('No active parent account was found for this phone number.');
    cleanup();
  });

  it('shows generic auth failures when no field error is returned', async () => {
    loginMock.mockRejectedValue(new Error('boom'));

    ({ container, root } = renderPage());

    const inputs = container?.querySelectorAll('input');
    setInputValue(inputs?.[0], '+251900000000');
    setInputValue(inputs?.[1], 'bad-password');

    await act(async () => {
      container?.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container?.textContent).toContain('Login failed. Please check your phone number and password.');
    cleanup();
  });
});
