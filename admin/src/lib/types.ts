// Types shared between admin pages. Matches the NestJS backend's JSON shape.

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

export interface Category {
  id: string;
  slug: string;
  name: string;
  keyMetric: CategoryKeyMetric;
  sortableFields: CategorySortableField[];
  insightThresholds: { good: number; warning: number };
}

export interface Manufacturer {
  id: string;
  name: string;
  aliases: string[];
}

export interface Nutrition {
  baseUnit: '100g' | '100ml' | 'serving';
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

export interface IngredientPart {
  name: string;
  pct?: number;
  origin?: string;
}

export type ProductStatus = 'pending' | 'approved' | 'rejected';

export interface AdminProduct {
  id: string;
  barcode: string | null;
  name: string;
  manufacturer: { id: string; name: string };
  category: { slug: string; name: string };
  volume: { value: number; unit: 'g' | 'ml' | 'ea' };
  price: { msrp: number | null; avgOnline: number | null };
  images: { product: string[]; label: string[] };
  ingredients: { rawText: string; parsed: IngredientPart[] };
  additives: string[];
  allergens: string[];
  nutrition: Nutrition;
  keyMetrics: Record<string, number | boolean>;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface AdminInsight {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  bodyMarkdown: string;
  relatedProductIds: string[];
  categorySlug: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightPayload {
  slug: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  bodyMarkdown: string;
  relatedProductIds: string[];
  categorySlug?: string | null;
  publishedAt?: string | null;
}

export interface UploadResult {
  url: string;
  size: number;
  mimetype: string;
}

export interface RevisionEntry {
  id: string;
  productId: string;
  changedBy: { id: string; name: string; email: string } | null;
  changes: Record<string, [unknown, unknown]>;
  reason: string | null;
  createdAt: string;
}

// Payload sent to POST/PUT /api/admin/products
export interface ProductPayload {
  barcode?: string;
  name: string;
  manufacturerId: string;
  categoryId: string;
  volume: { value: number; unit: 'g' | 'ml' | 'ea' };
  msrp?: number;
  avgOnlinePrice?: number;
  ingredients: { rawText: string; parsed: IngredientPart[] };
  additives: string[];
  allergens: string[];
  nutrition: Nutrition;
  keyMetrics: Record<string, number | boolean>;
  productImages: string[];
  labelImages: string[];
  status?: ProductStatus;
}
