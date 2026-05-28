import Link from 'next/link';
import { ProductForm } from '@/components/product-form';

export default function NewProductPage() {
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
          <h1 className="text-2xl font-semibold mt-1">신규 등록</h1>
        </div>
      </header>
      <ProductForm />
    </div>
  );
}
