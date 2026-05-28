'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { InsightForm } from '@/components/insight-form';
import { useInsight } from '@/hooks/use-insights';

export default function EditInsightPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const insight = useInsight(id);

  return (
    <div className="space-y-4">
      <header>
        <Link
          href="/insights"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 인사이트
        </Link>
        <h1 className="text-2xl font-semibold mt-1">
          {insight.data?.title ?? '인사이트 수정'}
        </h1>
      </header>
      {insight.isLoading && (
        <p className="text-sm text-gray-500">불러오는 중…</p>
      )}
      {insight.error && (
        <p className="text-sm text-red-600">{String(insight.error)}</p>
      )}
      {insight.data && <InsightForm initial={insight.data} />}
    </div>
  );
}
