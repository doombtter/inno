import type { ReactNode } from 'react';
import type { ProductStatus } from '@/lib/types';
import { cn } from '@/lib/cn';

const styles: Record<ProductStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-gray-100 text-gray-700 border-gray-200',
};

const labels: Record<ProductStatus, string> = {
  pending: '검수 대기',
  approved: '노출',
  rejected: '반려',
};

export function StatusBadge({
  status,
  children,
}: {
  status: ProductStatus;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs rounded-md border',
        styles[status],
      )}
    >
      {children ?? labels[status]}
    </span>
  );
}
