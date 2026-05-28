'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/components/product-form';
import { useProduct } from '@/hooks/use-products';
import { StatusBadge } from '@/components/ui/badge';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const product = useProduct(id);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/products"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 제품
          </Link>
          <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
            {product.data?.name ?? '제품 수정'}
            {product.data && <StatusBadge status={product.data.status} />}
          </h1>
        </div>
      </header>
      {product.isLoading && (
        <p className="text-sm text-gray-500">불러오는 중…</p>
      )}
      {product.error && (
        <p className="text-sm text-red-600">{String(product.error)}</p>
      )}
      {product.data && <ProductForm initial={product.data} />}
    </div>
  );
}
