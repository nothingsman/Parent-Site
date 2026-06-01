'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { getAccessToken, restoreSession } from '@/services/authService'

const App = dynamic(() => import('@/App'), { ssr: false })

export function ClientOnly({ dict }: { dict: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang as string || 'en';
  const [authReady, setAuthReady] = useState(false);
  const redirectToLogin = () => {
    router.replace(`/${lang}/login`);
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
      window.location.replace(`/${lang}/login`);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const isInvitationPath =
        pathname === `/${lang}/complete-parent-invitation` ||
        pathname.startsWith(`/${lang}/complete-parent-invitation/`);
      const isPublic = pathname === `/${lang}/login` || isInvitationPath;

      if (isPublic) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      if (!getAccessToken()) {
        await restoreSession();
      }

      if (!cancelled) {
        if (!getAccessToken()) {
          redirectToLogin();
          return;
        }
        setAuthReady(true);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, lang]);

  useEffect(() => {
    const isInvitationPath =
      pathname === `/${lang}/complete-parent-invitation` ||
      pathname.startsWith(`/${lang}/complete-parent-invitation/`);
    const isPublic = pathname === `/${lang}/login` || isInvitationPath;
    if (authReady && !isPublic && !getAccessToken()) {
      redirectToLogin();
    }
  }, [authReady, pathname, router, lang]);

  if (!authReady) return null;
  if (!getAccessToken() && pathname !== `/${lang}/login`) return null;
  return <App dict={dict} />
}
