'use client';

import { Input } from './ui/input';
import { Button } from './ui/button';
import { ImageUploader } from './image-uploader';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
}

export function UrlListField({ value, onChange, max = 5, label }: Props) {
  const update = (i: number, v: string) => {
    const next = [...value];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.map((url, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Input
            value={url}
            placeholder="https://... 또는 업로드"
            onChange={(e) => update(i, e.target.value)}
          />
          <ImageUploader
            label="업로드"
            onUploaded={(uploaded) => update(i, uploaded)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            제거
          </Button>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="preview"
              className="h-10 w-10 object-cover rounded border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="h-10 w-10 rounded border border-dashed border-gray-200" />
          )}
        </div>
      ))}
      {value.length < max && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...value, ''])}
        >
          + URL 추가
        </Button>
      )}
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  );
}
