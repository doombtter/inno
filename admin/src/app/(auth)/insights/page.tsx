'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useInsights } from '@/hooks/use-insights';
import { formatDate } from '@/lib/format';

export default function InsightsListPage() {
  const [q, setQ] = useState('');
  const [qApplied, setQApplied] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'any'>('any');
  const [page, setPage] = useState(1);

  const insights = useInsights({
    q: qApplied || undefined,
    status,
    page,
    size: 30,
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">인사이트</h1>
        <Link href="/insights/new">
          <Button>+ 신규 인사이트</Button>
        </Link>
      </header>

      <div className="flex flex-wrap gap-2 items-center">
        <form
          className="flex gap-2 flex-1 min-w-[240px]"
          onSubmit={(e) => {
            e.preventDefault();
            setQApplied(q.trim());
            setPage(1);
          }}
        >
          <Input
            placeholder="제목 또는 slug"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            검색
          </Button>
        </form>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          className="w-36"
        >
          <option value="any">모든 상태</option>
          <option value="draft">비공개</option>
          <option value="published">발행됨</option>
        </Select>
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>제목</Th>
              <Th>slug</Th>
              <Th>카테고리</Th>
              <Th>발행</Th>
              <Th>수정</Th>
            </tr>
          </thead>
          <tbody>
            {insights.isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            )}
            {insights.error && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-red-600">
                  {String(insights.error)}
                </td>
              </tr>
            )}
            {insights.data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  아직 인사이트가 없습니다
                </td>
              </tr>
            )}
            {insights.data?.items.map((i) => (
              <tr key={i.id} className="border-t border-gray-100">
                <Td>
                  <Link
                    href={`/insights/${i.id}`}
                    className="font-medium hover:underline"
                  >
                    {i.title}
                  </Link>
                  {i.subtitle && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {i.subtitle}
                    </div>
                  )}
                </Td>
                <Td className="font-mono text-xs">{i.slug}</Td>
                <Td>{i.categorySlug ?? '-'}</Td>
                <Td>
                  {i.publishedAt ? (
                    <span className="text-emerald-700">{formatDate(i.publishedAt)}</span>
                  ) : (
                    <span className="text-gray-400">비공개</span>
                  )}
                </Td>
                <Td className="text-xs text-gray-500">
                  {formatDate(i.updatedAt)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-medium px-3 py-2 whitespace-nowrap">
      {children}
    </th>
  );
}
function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 align-top ${className ?? ''}`}>{children}</td>;
}
