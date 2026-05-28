import Link from 'next/link';
import { InsightForm } from '@/components/insight-form';

export default function NewInsightPage() {
  return (
    <div className="space-y-4">
      <header>
        <Link
          href="/insights"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 인사이트
        </Link>
        <h1 className="text-2xl font-semibold mt-1">신규 인사이트</h1>
      </header>
      <InsightForm />
    </div>
  );
}
