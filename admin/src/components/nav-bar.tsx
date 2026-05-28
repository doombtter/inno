'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { clearToken } from '@/lib/auth';

export function NavBar() {
  const router = useRouter();
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearToken();
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
