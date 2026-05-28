import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { NavBar } from '@/components/nav-bar';

export default function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </AuthGuard>
  );
}
