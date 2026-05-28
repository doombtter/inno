'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { StatusBadge } from './ui/badge';
import { TagInput } from './tag-input';
import { UrlListField } from './url-list-field';
import { ManufacturerCombobox } from './manufacturer-combobox';
import { KeyMetricsFields } from './key-metrics-fields';
import { useCategories } from '@/hooks/use-categories';
import {
  useCreateProduct,
  useUpdateProduct,
  useUpdateStatus,
} from '@/hooks/use-products';
import type { AdminProduct, ProductPayload, ProductStatus } from '@/lib/types';
import { ApiError } from '@/lib/api';

interface Props {
  /// If supplied, the form opens in edit mode and PUTs to /:id.
  initial?: AdminProduct;
}

// Plain state shape — react-hook-form is overkill given the dynamic fields.
// We use a flat object keyed by the same names as ProductPayload, plus a few
// scratch fields (e.g. number-as-string for empty inputs).
interface FormState {
  barcode: string;
  name: string;
  manufacturerId: string;
  categoryId: string;
  volumeValue: string;
  volumeUnit: 'g' | 'ml' | 'ea';
  msrp: string;
  avgOnlinePrice: string;
  rawIngredients: string;
  parsedIngredientsJson: string; // free-form for now
  additives: string[];
  allergens: string[];
  nutritionBaseUnit: '100g' | '100ml' | 'serving';
  nutritionBaseAmount: string;
  nutrition: Record<string, string>; // kcal, protein, ...
  keyMetrics: Record<string, number | boolean>;
  productImages: string[];
  labelImages: string[];
  status: ProductStatus;
}

const NUTRITION_FIELDS: Array<{ key: keyof FormState['nutrition'] & string; label: string; unit: string }> = [
  { key: 'kcal', label: '칼로리', unit: 'kcal' },
  { key: 'protein', label: '단백질', unit: 'g' },
  { key: 'carb', label: '탄수화물', unit: 'g' },
  { key: 'sugar', label: '당류', unit: 'g' },
  { key: 'fat', label: '지방', unit: 'g' },
  { key: 'saturatedFat', label: '포화지방', unit: 'g' },
  { key: 'sodium', label: '나트륨', unit: 'mg' },
  { key: 'cholesterol', label: '콜레스테롤', unit: 'mg' },
];

function fromInitial(p: AdminProduct): FormState {
  const n = p.nutrition;
  const nutrition: Record<string, string> = {};
  for (const f of NUTRITION_FIELDS) {
    const v = (n as unknown as Record<string, number | undefined>)[f.key];
    if (typeof v === 'number') nutrition[f.key] = String(v);
  }
  return {
    barcode: p.barcode ?? '',
    name: p.name,
    manufacturerId: p.manufacturer.id,
    categoryId: '',
    volumeValue: String(p.volume.value),
    volumeUnit: p.volume.unit,
    msrp: p.price.msrp != null ? String(p.price.msrp) : '',
    avgOnlinePrice: p.price.avgOnline != null ? String(p.price.avgOnline) : '',
    rawIngredients: p.ingredients.rawText,
    parsedIngredientsJson: JSON.stringify(p.ingredients.parsed, null, 2),
    additives: p.additives,
    allergens: p.allergens,
    nutritionBaseUnit: n.baseUnit,
    nutritionBaseAmount: String(n.baseAmount),
    nutrition,
    keyMetrics: p.keyMetrics,
    productImages: p.images.product.length ? p.images.product : [''],
    labelImages: p.images.label,
    status: p.status,
  };
}

function blank(): FormState {
  return {
    barcode: '',
    name: '',
    manufacturerId: '',
    categoryId: '',
    volumeValue: '',
    volumeUnit: 'g',
    msrp: '',
    avgOnlinePrice: '',
    rawIngredients: '',
    parsedIngredientsJson: '[]',
    additives: [],
    allergens: [],
    nutritionBaseUnit: '100g',
    nutritionBaseAmount: '100',
    nutrition: {},
    keyMetrics: {},
    productImages: [''],
    labelImages: [],
    status: 'approved',
  };
}

export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const categories = useCategories();
  const [state, setState] = useState<FormState>(() =>
    initial ? fromInitial(initial) : blank(),
  );
  const [error, setError] = useState<string | null>(null);

  const create = useCreateProduct();
  const update = useUpdateProduct(initial?.id ?? '');
  const statusMut = useUpdateStatus(initial?.id ?? '');

  // For edits, the API returns category.slug only. Resolve to id once the
  // category list arrives.
  useEffect(() => {
    if (initial && categories.data && !state.categoryId) {
      const cat = categories.data.find((c) => c.slug === initial.category.slug);
      if (cat) setState((s) => ({ ...s, categoryId: cat.id }));
    }
  }, [initial, categories.data, state.categoryId]);

  const currentCategory = categories.data?.find(
    (c) => c.id === state.categoryId,
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validate(state);
    if (validation) {
      setError(validation);
      return;
    }

    let parsed: { name: string; pct?: number; origin?: string }[];
    try {
      parsed = JSON.parse(state.parsedIngredientsJson || '[]');
      if (!Array.isArray(parsed)) throw new Error('parsed must be an array');
    } catch (e) {
      setError(`원재료 구조화 JSON 형식 오류: ${(e as Error).message}`);
      return;
    }

    const payload: ProductPayload = {
      ...(state.barcode ? { barcode: state.barcode.trim() } : {}),
      name: state.name.trim(),
      manufacturerId: state.manufacturerId,
      categoryId: state.categoryId,
      volume: {
        value: Number(state.volumeValue),
        unit: state.volumeUnit,
      },
      ...(state.msrp ? { msrp: Math.round(Number(state.msrp)) } : {}),
      ...(state.avgOnlinePrice
        ? { avgOnlinePrice: Math.round(Number(state.avgOnlinePrice)) }
        : {}),
      ingredients: {
        rawText: state.rawIngredients.trim(),
        parsed,
      },
      additives: state.additives,
      allergens: state.allergens,
      nutrition: {
        baseUnit: state.nutritionBaseUnit,
        baseAmount: Number(state.nutritionBaseAmount),
        ...Object.fromEntries(
          Object.entries(state.nutrition)
            .filter(([, v]) => v !== '')
            .map(([k, v]) => [k, Number(v)]),
        ),
      },
      keyMetrics: state.keyMetrics,
      productImages: state.productImages.filter((u) => u.trim()),
      labelImages: state.labelImages.filter((u) => u.trim()),
      status: state.status,
    };

    try {
      if (initial) {
        await update.mutateAsync(payload);
      } else {
        const created = await create.mutateAsync(payload);
        router.replace(`/products/${created.id}`);
        return;
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `${e.status === 409 ? '중복' : '실패'}: ${e.message}`
          : (e as Error).message,
      );
    }
  }

  const firstImage = state.productImages.find((u) => u.trim());
  const pending =
    create.isPending || update.isPending || statusMut.isPending;

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <aside className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h2 className="text-sm font-medium mb-3">제품 이미지</h2>
          {firstImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstImage}
              alt="제품"
              className="w-full aspect-square object-cover rounded-md bg-gray-50"
            />
          ) : (
            <div className="w-full aspect-square rounded-md bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
              이미지 URL을 입력하세요
            </div>
          )}
          <div className="mt-3">
            <UrlListField
              value={state.productImages}
              onChange={(v) => set('productImages', v)}
              label="제품 사진 1-5장 (앱 카드에 첫 번째 사용)"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h2 className="text-sm font-medium mb-3">라벨 이미지</h2>
          <UrlListField
            value={state.labelImages}
            onChange={(v) => set('labelImages', v)}
            label="영양성분/원재료 라벨 사진"
          />
        </div>

        {initial && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h2 className="text-sm font-medium mb-3 flex items-center justify-between">
              상태
              <StatusBadge status={initial.status} />
            </h2>
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected'] as ProductStatus[]).map(
                (s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={initial.status === s ? 'primary' : 'secondary'}
                    onClick={async () => {
                      try {
                        await statusMut.mutateAsync(s);
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    disabled={pending || initial.status === s}
                  >
                    {s === 'pending'
                      ? '검수 대기'
                      : s === 'approved'
                        ? '노출'
                        : '반려'}
                  </Button>
                ),
              )}
            </div>
          </div>
        )}
      </aside>

      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
          <h2 className="text-sm font-medium">기본 정보</h2>
          <div>
            <Label required>제품명</Label>
            <Input
              value={state.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예: 스팸 클래식 200g"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>바코드</Label>
              <Input
                value={state.barcode}
                onChange={(e) => set('barcode', e.target.value)}
                placeholder="8-13자리 숫자"
              />
            </div>
            <div>
              <Label required>카테고리</Label>
              <Select
                value={state.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                required
              >
                <option value="">선택하세요</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label required>제조사</Label>
            <ManufacturerCombobox
              value={state.manufacturerId}
              onChange={(id) => set('manufacturerId', id)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label required>용량</Label>
              <Input
                type="number"
                step="0.1"
                value={state.volumeValue}
                onChange={(e) => set('volumeValue', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>단위</Label>
              <Select
                value={state.volumeUnit}
                onChange={(e) =>
                  set('volumeUnit', e.target.value as 'g' | 'ml' | 'ea')
                }
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="ea">개</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>권장가 (원)</Label>
              <Input
                type="number"
                value={state.msrp}
                onChange={(e) => set('msrp', e.target.value)}
              />
            </div>
            <div>
              <Label>평균 온라인가 (원)</Label>
              <Input
                type="number"
                value={state.avgOnlinePrice}
                onChange={(e) => set('avgOnlinePrice', e.target.value)}
              />
            </div>
          </div>
        </div>

        {currentCategory && (
          <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
            <h2 className="text-sm font-medium">
              핵심 지표
              <span className="text-xs text-gray-400 ml-2">
                {currentCategory.name} 카테고리 기준
              </span>
            </h2>
            <KeyMetricsFields
              category={currentCategory}
              value={state.keyMetrics}
              onChange={(v) => set('keyMetrics', v)}
            />
          </div>
        )}
        {!currentCategory && state.categoryId === '' && (
          <p className="text-xs text-gray-500">
            카테고리를 먼저 선택하면 핵심 지표 입력 칸이 나타납니다
          </p>
        )}

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-medium">원재료</h2>
          <div>
            <Label required>원재료 전체 텍스트</Label>
            <Textarea
              rows={3}
              value={state.rawIngredients}
              onChange={(e) => set('rawIngredients', e.target.value)}
              placeholder="라벨에 적힌 그대로"
              required
            />
          </div>
          <div>
            <Label hint="JSON 배열: [{name, pct?, origin?}]">
              구조화 (선택)
            </Label>
            <Textarea
              rows={4}
              value={state.parsedIngredientsJson}
              onChange={(e) => set('parsedIngredientsJson', e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label>첨가물</Label>
            <TagInput
              value={state.additives}
              onChange={(v) => set('additives', v)}
              placeholder="예: 아질산나트륨"
            />
          </div>
          <div>
            <Label>알레르기 유발</Label>
            <TagInput
              value={state.allergens}
              onChange={(v) => set('allergens', v)}
              placeholder="예: 돼지고기"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-medium">영양성분</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>기준 단위</Label>
              <Select
                value={state.nutritionBaseUnit}
                onChange={(e) =>
                  set(
                    'nutritionBaseUnit',
                    e.target.value as FormState['nutritionBaseUnit'],
                  )
                }
              >
                <option value="100g">100g 기준</option>
                <option value="100ml">100ml 기준</option>
                <option value="serving">1회 제공량 기준</option>
              </Select>
            </div>
            <div>
              <Label>기준 양</Label>
              <Input
                type="number"
                value={state.nutritionBaseAmount}
                onChange={(e) => set('nutritionBaseAmount', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {NUTRITION_FIELDS.map((f) => (
              <div key={f.key}>
                <Label>
                  {f.label} ({f.unit})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={state.nutrition[f.key] ?? ''}
                  onChange={(e) =>
                    set('nutrition', {
                      ...state.nutrition,
                      [f.key]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h2 className="text-sm font-medium">최초 상태</h2>
          <Select
            value={state.status}
            onChange={(e) => set('status', e.target.value as ProductStatus)}
          >
            <option value="approved">바로 노출 (approved)</option>
            <option value="pending">검수 대기 (pending)</option>
          </Select>
          {initial && (
            <p className="text-xs text-gray-500">
              저장 후에도 좌측 패널의 상태 버튼으로 변경할 수 있습니다.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/products')}
          >
            취소
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? '저장 중…' : initial ? '저장' : '등록'}
          </Button>
        </div>
      </section>
    </form>
  );
}

function validate(s: FormState): string | null {
  if (!s.name.trim()) return '제품명을 입력하세요';
  if (!s.manufacturerId) return '제조사를 선택하세요';
  if (!s.categoryId) return '카테고리를 선택하세요';
  if (!s.volumeValue || Number.isNaN(Number(s.volumeValue)))
    return '용량을 숫자로 입력하세요';
  if (!s.rawIngredients.trim()) return '원재료 텍스트를 입력하세요';
  if (s.barcode && !/^[0-9]{8,13}$/.test(s.barcode))
    return '바코드는 8-13자리 숫자여야 합니다';
  return null;
}
