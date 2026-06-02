'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureApiClient } from '@/lib/apiClient';
import { getAccessToken } from '@/services/authService';
import { initMocks } from '@/mocks';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — data stays fresh
      retry: 2,                    // retry failed requests twice
      refetchOnWindowFocus: false, // avoid jarring refetches in a portal
    },
    mutations: {
      retry: 0,                    // mutations do not retry automatically
    },
  },
});

// Configure the API client with auth callbacks
configureApiClient({
  getAccessToken,
  onUnauthorized: () => {
    // Clear React Query cache
    queryClient.clear();
    if (typeof window !== 'undefined') {
      // Clear homework confirmation flags
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('homework-confirmed-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Try to call backend logout to clear the HttpOnly refresh token cookie
      fetch('/auth/jwt/logout/', { method: 'POST', credentials: 'include' }).catch(() => {});

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
  },
  onServerError: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('api:server-error', { detail: { message } })
      );
    }
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Wait for MSW to register its service worker before rendering the app.
  // This prevents API calls from firing before the mock interceptors are ready.
  const [mocksReady, setMocksReady] = useState(false);

  useEffect(() => {
    initMocks()
      .catch(console.error)
      .finally(() => setMocksReady(true));
  }, []);

  if (!mocksReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-[#3949AB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
