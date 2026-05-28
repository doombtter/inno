'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useCreateManufacturer, useManufacturers } from '@/hooks/use-manufacturers';
import type { Manufacturer } from '@/lib/types';

interface Props {
  value: string;          // manufacturerId
  onChange: (id: string, m: Manufacturer) => void;
}

/// Live-filtered manufacturer picker. Typing a name that doesn't exist
/// reveals a "‘x’ 새로 등록" button which calls POST /admin/manufacturers
/// and selects the newly created row.
export function ManufacturerCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const list = useManufacturers(query);
  const create = useCreateManufacturer();

  // Resolve the selected id back to a name for display.
  const initial = useManufacturers('');
  const selected =
    list.data?.find((m) => m.id === value) ??
    initial.data?.find((m) => m.id === value);

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const exactMatch = (list.data ?? []).some(
    (m) => m.name === query.trim(),
  );
  const showCreate =
    query.trim().length > 0 &&
    !exactMatch &&
    !list.isLoading;

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={open ? query : selected?.name ?? ''}
        placeholder={selected ? '' : '제조사 검색'}
        onFocus={() => {
          setOpen(true);
          setQuery(selected?.name ?? '');
        }}
        onChange={(e) => setQuery(e.target.value)}
        readOnly={!open}
      />
      {open && (
        <div
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200
                       rounded-md shadow-lg max-h-64 overflow-auto"
        >
          {list.data?.map((m) => (
            <button
              key={m.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                onChange(m.id, m);
                setOpen(false);
              }}
            >
              {m.name}
            </button>
          ))}
          {list.data?.length === 0 && !showCreate && (
            <div className="px-3 py-2 text-sm text-gray-500">검색 결과 없음</div>
          )}
          {showCreate && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <Button
                size="sm"
                variant="secondary"
                disabled={create.isPending}
                onClick={async () => {
                  const m = await create.mutateAsync(query.trim());
                  onChange(m.id, m);
                  setOpen(false);
                }}
              >
                {create.isPending
                  ? '등록 중…'
                  : `‘${query.trim()}’ 새 제조사로 등록`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
