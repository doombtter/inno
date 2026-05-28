'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import {
  clearSession,
  getUser,
  hasToken,
  setSession,
  type AdminUser,
} from '@/lib/auth';

/// Wraps the (auth) route group. On mount:
///   1. If there's no token in storage → redirect to /login.
///   2. If there is one, hit /admin/auth/me to refresh the user record
///      (in case the role changed) and detect stale tokens (401 → logout).
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!hasToken()) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    setBootstrapped(true);
  }, [router, pathname]);

  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const user = await api<AdminUser>('/admin/auth/me');
        // refresh cached user (role might have changed server-side)
        const token = window.localStorage.getItem('inno_admin_token');
        if (token) setSession(token, user);
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        }
        throw err;
      }
    },
    enabled: bootstrapped,
    retry: false,
  });

  if (!bootstrapped || me.isLoading) {
    return (
      <div className="p-12 text-center text-sm text-gray-500">
        인증 확인 중…
      </div>
    );
  }
  if (me.error) {
    return null; // redirect already in flight
  }
  return <>{children}</>;
}

/// Tiny helper for components that need to gate UI by role.
export function useCurrentUser(): AdminUser | null {
  return getUser();
}
