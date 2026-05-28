import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminProduct,
  Paged,
  ProductPayload,
  ProductStatus,
} from '@/lib/types';

export interface ProductListFilter {
  q?: string;
  category?: string;
  status?: ProductStatus | 'any';
  page?: number;
  size?: number;
}

export function useProducts(filter: ProductListFilter) {
  return useQuery({
    queryKey: ['admin-products', filter],
    queryFn: () =>
      api<Paged<AdminProduct>>('/admin/products', {
        query: {
          q: filter.q,
          category: filter.category,
          status: filter.status,
          page: filter.page,
          size: filter.size,
        },
      }),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api<AdminProduct>(`/admin/products/${id!}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) =>
      api<AdminProduct>('/admin/products', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) =>
      api<AdminProduct>(`/admin/products/${id}`, {
        method: 'PUT',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
    },
  });
}

export function useUpdateStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ProductStatus) =>
      api<AdminProduct>(`/admin/products/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
    },
  });
}
