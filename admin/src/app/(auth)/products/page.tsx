'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/use-categories';
import { useProducts } from '@/hooks/use-products';
import { formatDate, formatWon } from '@/lib/format';
import type { ProductStatus } from '@/lib/types';

export default function ProductsListPage() {
  const [q, setQ] = useState('');
  const [qApplied, setQApplied] = useState('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<ProductStatus | 'any'>('any');
  const [page, setPage] = useState(1);

  const categories = useCategories();
  const products = useProducts({
    q: qApplied || undefined,
    category: category || undefined,
    status,
    page,
    size: 30,
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">제품</h1>
        <Link href="/products/new">
          <Button>+ 신규 등록</Button>
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
            placeholder="제품명 또는 제조사"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button type="submit" variant="secondary">검색</Button>
        </form>

        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">전체 카테고리</option>
          {categories.data?.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | 'any');
            setPage(1);
          }}
          className="w-36"
        >
          <option value="any">모든 상태</option>
          <option value="pending">검수 대기</option>
          <option value="approved">노출</option>
          <option value="rejected">반려</option>
        </Select>
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>제품명</Th>
              <Th>제조사</Th>
              <Th>카테고리</Th>
              <Th>핵심 지표</Th>
              <Th>가격</Th>
              <Th>상태</Th>
              <Th>수정</Th>
            </tr>
          </thead>
          <tbody>
            {products.isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            )}
            {products.error && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-red-600">
                  {String(products.error)}
                </td>
              </tr>
            )}
            {products.data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  결과가 없습니다
                </td>
              </tr>
            )}
            {products.data?.items.map((p) => {
              const cat = categories.data?.find((c) => c.slug === p.category.slug);
              const metricField = cat?.keyMetric.field;
              const metricVal = metricField ? p.keyMetrics[metricField] : undefined;
              const price = p.price.avgOnline ?? p.price.msrp;
              return (
                <tr key={p.id} className="border-t border-gray-100">
                  <Td>
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(p.updatedAt)}
                    </div>
                  </Td>
                  <Td>{p.manufacturer.name}</Td>
                  <Td>{p.category.name}</Td>
                  <Td>
                    {metricVal === undefined
                      ? '-'
                      : typeof metricVal === 'boolean'
                        ? metricVal ? '예' : '아니오'
                        : `${metricVal}${cat?.keyMetric.unit ?? ''}`}
                  </Td>
                  <Td>{formatWon(price)}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td>
                    <Link
                      href={`/products/${p.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      열기 →
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.data && products.data.total > products.data.size && (
        <Pagination
          page={products.data.page}
          size={products.data.size}
          total={products.data.total}
          onChange={setPage}
        />
      )}
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
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}

function Pagination({
  page,
  size,
  total,
  onChange,
}: {
  page: number;
  size: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const last = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        {(page - 1) * size + 1}-{Math.min(page * size, total)} / {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          이전
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
