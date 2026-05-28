import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Manufacturer } from '@/lib/types';

export function useManufacturers(query: string = '') {
  return useQuery({
    queryKey: ['manufacturers', query],
    queryFn: () =>
      api<Manufacturer[]>('/admin/manufacturers', {
        query: { q: query || undefined, limit: 30 },
      }),
    staleTime: 60_000,
  });
}

export function useCreateManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<Manufacturer>('/admin/manufacturers', {
        method: 'POST',
        body: { name },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manufacturers'] });
    },
  });
}
