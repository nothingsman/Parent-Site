import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { ClientOnly, isPublicPath } from './client';

const replaceMock = vi.fn();
const pathnameState = {
  value: '/login',
};
const accessTokenMock = vi.fn<() => string | null>();
const restoreSessionMock = vi.fn();

vi.mock('next/dynamic', () => ({
  default: () => function MockDynamicComponent() {
    return <div>Mock App</div>;
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => pathnameState.value,
}));

vi.mock('@/services/authService', () => ({
  getAccessToken: () => accessTokenMock(),
  restoreSession: () => restoreSessionMock(),
}));

describe('ClientOnly', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    replaceMock.mockReset();
    restoreSessionMock.mockReset();
    accessTokenMock.mockReset();
    accessTokenMock.mockReturnValue(null);
    pathnameState.value = '/login';
  });

  function renderClientOnly() {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(<ClientOnly />);
    });
  }

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

  it('treats invitation routes as public paths', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/complete-parent-invitation')).toBe(true);
    expect(isPublicPath('/complete-parent-invitation/uid/token')).toBe(true);
    expect(isPublicPath('/')).toBe(false);
  });

  it('renders invitation routes without an access token', async () => {
    pathnameState.value = '/complete-parent-invitation/uid/token';

    await act(async () => {
      renderClientOnly();
    });

    expect(restoreSessionMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(container?.textContent).toContain('Mock App');
    cleanup();
  });

  it('redirects protected routes when unauthenticated', async () => {
    pathnameState.value = '/';
    const windowReplaceMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        replace: windowReplaceMock,
      },
      writable: true,
    });

    await act(async () => {
      renderClientOnly();
    });

    expect(restoreSessionMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/login');
    expect(windowReplaceMock).toHaveBeenCalledWith('/login');
    cleanup();
  });
});
