import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminInsight,
  InsightPayload,
  Paged,
} from '@/lib/types';

export interface InsightListFilter {
  q?: string;
  status?: 'draft' | 'published' | 'any';
  page?: number;
  size?: number;
}

export function useInsights(filter: InsightListFilter) {
  return useQuery({
    queryKey: ['admin-insights', filter],
    queryFn: () =>
      api<Paged<AdminInsight>>('/admin/insights', {
        query: {
          q: filter.q,
          status: filter.status,
          page: filter.page,
          size: filter.size,
        },
      }),
  });
}

export function useInsight(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-insight', id],
    queryFn: () => api<AdminInsight>(`/admin/insights/${id!}`),
    enabled: !!id,
  });
}

export function useCreateInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InsightPayload) =>
      api<AdminInsight>('/admin/insights', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-insights'] }),
  });
}

export function useUpdateInsight(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InsightPayload) =>
      api<AdminInsight>(`/admin/insights/${id}`, {
        method: 'PUT',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-insights'] });
      qc.invalidateQueries({ queryKey: ['admin-insight', id] });
    },
  });
}

export function usePublishInsight(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publishedAt: string | null) =>
      api<AdminInsight>(`/admin/insights/${id}/publish`, {
        method: 'PATCH',
        body: { publishedAt },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-insights'] });
      qc.invalidateQueries({ queryKey: ['admin-insight', id] });
    },
  });
}

export function useDeleteInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/admin/insights/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-insights'] }),
  });
}
