'use client';

import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Category } from '@/lib/types';

/// Auto-generates form rows for a category's key metrics, driven by
/// `category.sortableFields` + `category.keyMetric`. All known fields are
/// numeric in the seeded categories; booleans (e.g. juice's `hfcs`) live
/// outside sortableFields and we render them as a checkbox if the field
/// name ends in known boolean suffixes.
///
/// The form state is a Record<string, number | boolean> keyed by the unqualified
/// field name (e.g. `pork_content_pct`, not `key_metrics.pork_content_pct`).

interface Props {
  category: Category;
  value: Record<string, number | boolean>;
  onChange: (next: Record<string, number | boolean>) => void;
}

// Booleans that aren't in sortableFields but are part of the seeded JUICE schema.
const KNOWN_BOOLEAN_FIELDS_PER_CATEGORY: Record<string, string[]> = {
  juice: ['hfcs', 'artificial_flavor', 'concentrate_restored'],
};

const BOOLEAN_LABELS: Record<string, string> = {
  hfcs: '액상과당 사용',
  artificial_flavor: '합성착향료 사용',
  concentrate_restored: '농축액 환원',
};

export function KeyMetricsFields({ category, value, onChange }: Props) {
  const numericFields = collectNumericFields(category);
  const booleanFields = KNOWN_BOOLEAN_FIELDS_PER_CATEGORY[category.slug] ?? [];

  const update = (key: string, v: number | boolean | null) => {
    const next = { ...value };
    if (v === null) {
      delete next[key];
    } else {
      next[key] = v;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {numericFields.map((f) => {
        const current = value[f.field];
        return (
          <div key={f.field}>
            <Label hint={f.field}>
              {f.label} <span className="text-gray-400">({f.unit})</span>
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={current === undefined ? '' : String(current)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') return update(f.field, null);
                const n = Number(raw);
                if (Number.isFinite(n)) update(f.field, n);
              }}
            />
          </div>
        );
      })}
      {booleanFields.length > 0 && (
        <div className="space-y-1 pt-2">
          {booleanFields.map((field) => (
            <label
              key={field}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={value[field] === true}
                onChange={(e) => update(field, e.target.checked)}
              />
              {BOOLEAN_LABELS[field] ?? field}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface NumericField {
  field: string;
  label: string;
  unit: string;
}

function collectNumericFields(category: Category): NumericField[] {
  const out: NumericField[] = [];
  const seen = new Set<string>();

  // Key metric always comes first.
  out.push({
    field: category.keyMetric.field,
    label: category.keyMetric.label,
    unit: category.keyMetric.unit,
  });
  seen.add(category.keyMetric.field);

  for (const sf of category.sortableFields) {
    // sortable_fields includes things like "key_metrics.X" and "nutrition.X" —
    // the form only owns key_metrics.* keys; nutrition is a separate section.
    if (!sf.field.startsWith('key_metrics.')) continue;
    const bare = sf.field.slice('key_metrics.'.length);
    if (seen.has(bare)) continue;
    seen.add(bare);
    out.push({
      field: bare,
      label: sf.label,
      unit: category.keyMetric.unit, // best guess; numeric sortables share %
    });
  }

  return out;
}
