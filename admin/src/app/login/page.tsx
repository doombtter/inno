'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center" />}
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') || '/products';

  const [token, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setToken(token);
    try {
      await api('/admin/manufacturers', { query: { limit: 1 } });
      router.replace(from);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('토큰이 올바르지 않습니다');
      } else {
        setError('서버에 연결할 수 없습니다');
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">인노 어드민</h1>
        <p className="text-sm text-gray-500 mb-6">운영자 토큰을 입력하세요</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token" required>
              ADMIN_TOKEN
            </Label>
            <Input
              id="token"
              type="password"
              autoFocus
              value={token}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="공유받은 토큰"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={!token || loading} className="w-full">
            {loading ? '확인 중…' : '들어가기'}
          </Button>
        </form>
      </div>
    </main>
  );
}
