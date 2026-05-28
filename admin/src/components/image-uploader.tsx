'use client';

import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { uploadFile, ApiError } from '@/lib/api';

interface Props {
  onUploaded: (url: string) => void;
  label?: string;
  size?: 'sm' | 'md';
}

/// Tiny button that opens a file picker, POSTs the chosen file to
/// /api/admin/uploads, and hands the resulting URL back to the parent.
export function ImageUploader({ onUploaded, label = '파일 업로드', size = 'sm' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadFile(file);
      onUploaded(url);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : (err as Error).message ?? '업로드 실패',
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onChange}
        className="hidden"
      />
      <Button
        type="button"
        size={size}
        variant="secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? '업로드 중…' : label}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
