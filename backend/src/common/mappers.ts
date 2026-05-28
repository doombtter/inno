import type {
  CategoryDto,
  InsightDto,
  IngredientPart,
  NutritionBaseUnit,
  NutritionDto,
  ProductDto,
  VolumeUnit,
} from './types';

// Raw row shape coming back from a product SELECT that joins manufacturers + categories.
export interface ProductRow {
  id: string;
  barcode: string | null;
  name: string;
  volume_value: string | number;
  volume_unit: VolumeUnit;
  msrp: string | number | null;
  avg_online_price: string | number | null;
  ingredients_raw_text: string | null;
  ingredients_parsed: IngredientPart[] | null;
  additives: string[] | null;
  allergens: string[] | null;
  nutrition_base_unit: NutritionBaseUnit;
  nutrition_base_amount: string | number;
  nutrition: Record<string, number> | null;
  key_metrics: Record<string, number | boolean> | null;
  product_images: string[] | null;
  label_images: string[] | null;
  m_id: string;
  m_name: string;
  c_slug: string;
  c_name: string;
  // Optional window-function columns populated by listByCategory().
  metric_rank?: string | number | null;
  total_count?: string | number | null;
  avg_metric?: string | number | null;
}

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function rowToProductDto(row: ProductRow): ProductDto {
  const nutritionExtras = row.nutrition ?? {};
  const nutrition: NutritionDto = {
    baseUnit: row.nutrition_base_unit,
    baseAmount: toNum(row.nutrition_base_amount) ?? 100,
    ...nutritionExtras,
  };

  const dto: ProductDto = {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    manufacturer: { id: row.m_id, name: row.m_name },
    category: { slug: row.c_slug, name: row.c_name },
    volume: {
      value: toNum(row.volume_value) ?? 0,
      unit: row.volume_unit,
    },
    price: {
      msrp: toNum(row.msrp),
      avgOnline: toNum(row.avg_online_price),
    },
    images: {
      product: row.product_images ?? [],
      label: row.label_images ?? [],
    },
    ingredients: {
      rawText: row.ingredients_raw_text ?? '',
      parsed: row.ingredients_parsed ?? [],
    },
    additives: row.additives ?? [],
    allergens: row.allergens ?? [],
    nutrition,
    keyMetrics: row.key_metrics ?? {},
  };

  if (row.metric_rank != null) {
    dto.categoryStats = {
      rank: toNum(row.metric_rank) ?? 0,
      total: toNum(row.total_count) ?? 0,
      avgKeyMetric: toNum(row.avg_metric) ?? 0,
    };
  }

  return dto;
}

// ---------------------------------------------------------------------------

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  key_metrics_schema: {
    key_metric?: { field?: string; label?: string; unit?: string; higher_is_better?: boolean };
    sortable_fields?: Array<{ field: string; label: string; higher_is_better?: boolean }>;
    insight_thresholds?: { good?: number; warning?: number };
  } | null;
  display_order: number;
  is_active: boolean;
}

export function rowToCategoryDto(row: CategoryRow): CategoryDto {
  const schema = row.key_metrics_schema ?? {};
  const km = schema.key_metric ?? {};
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    keyMetric: {
      field: km.field ?? '',
      label: km.label ?? '',
      unit: km.unit ?? '%',
      higherIsBetter: km.higher_is_better ?? true,
    },
    sortableFields: (schema.sortable_fields ?? []).map((f) => ({
      field: f.field,
      label: f.label,
      higherIsBetter: f.higher_is_better ?? true,
    })),
    insightThresholds: {
      good: schema.insight_thresholds?.good ?? 0,
      warning: schema.insight_thresholds?.warning ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------

export interface InsightRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  body_markdown: string;
  related_product_ids: string[] | null;
  c_slug: string | null;
  published_at: Date | null;
}

export function rowToInsightDto(row: InsightRow): InsightDto {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    thumbnail: row.thumbnail,
    bodyMarkdown: row.body_markdown,
    relatedProductIds: row.related_product_ids ?? [],
    categorySlug: row.c_slug,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
  };
}
