'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { clearSession } from '@/lib/auth';
import { useCurrentUser } from './auth-guard';

export function NavBar() {
  const router = useRouter();
  const user = useCurrentUser();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/products" className="flex items-baseline gap-2">
          <span className="font-bold text-lg tracking-tight">인노</span>
          <span className="text-xs text-gray-500">어드민</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/products"
            className="text-gray-700 hover:text-gray-900"
          >
            제품
          </Link>
          <Link
            href="/products/new"
            className="text-gray-700 hover:text-gray-900"
          >
            신규 등록
          </Link>
          {user && (
            <span className="text-xs text-gray-500 ml-2">
              {user.name}
              <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {user.role}
              </span>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSession();
              router.replace('/login');
            }}
          >
            로그아웃
          </Button>
        </nav>
      </div>
    </header>
  );
}
