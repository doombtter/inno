// Domain DTOs returned by the API.
// The main app (Flutter) consumes these shapes directly.

export type VolumeUnit = 'g' | 'ml' | 'ea';
export type NutritionBaseUnit = '100g' | '100ml' | 'serving';

export interface IngredientPart {
  name: string;
  pct?: number;
  origin?: string;
}

export interface NutritionDto {
  baseUnit: NutritionBaseUnit;
  baseAmount: number;
  kcal?: number;
  protein?: number;
  carb?: number;
  sugar?: number;
  fat?: number;
  saturatedFat?: number;
  sodium?: number;
  cholesterol?: number;
}

export interface ProductDto {
  id: string;
  barcode: string | null;
  name: string;
  manufacturer: { id: string; name: string };
  category: { slug: string; name: string };
  volume: { value: number; unit: VolumeUnit };
  price: { msrp: number | null; avgOnline: number | null };
  images: { product: string[]; label: string[] };
  ingredients: { rawText: string; parsed: IngredientPart[] };
  additives: string[];
  allergens: string[];
  nutrition: NutritionDto;
  keyMetrics: Record<string, number | boolean>;
  categoryStats?: {
    rank: number;
    total: number;
    avgKeyMetric: number;
  };
}

export interface CategoryKeyMetric {
  field: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
}

export interface CategorySortableField {
  field: string;
  label: string;
  higherIsBetter: boolean;
}

export interface CategoryDto {
  slug: string;
  name: string;
  keyMetric: CategoryKeyMetric;
  sortableFields: CategorySortableField[];
  insightThresholds: { good: number; warning: number };
}

export interface InsightDto {
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  bodyMarkdown: string;
  relatedProductIds: string[];
  categorySlug: string | null;
  publishedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
