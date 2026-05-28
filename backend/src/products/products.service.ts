import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CategoriesService } from '../categories/categories.service';
import {
  CategoryRow,
  ProductRow,
  rowToProductDto,
} from '../common/mappers';
import type { PagedResult, ProductDto } from '../common/types';

const SAFE_IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// The SELECT list shared by every product query — kept identical so the row
// shape always matches ProductRow + rowToProductDto.
const PRODUCT_SELECT = `
  p.id, p.barcode, p.name,
  p.volume_value, p.volume_unit,
  p.msrp, p.avg_online_price,
  p.ingredients_raw_text, p.ingredients_parsed,
  p.additives, p.allergens,
  p.nutrition_base_unit, p.nutrition_base_amount, p.nutrition,
  p.key_metrics,
  p.product_images, p.label_images,
  m.id AS m_id, m.name AS m_name,
  c.slug AS c_slug, c.name AS c_name
`;

interface SortSpec {
  /** SQL fragment safe to inject into ORDER BY (column refs only, no user input). */
  expr: string;
  /** 'ASC' | 'DESC' */
  direction: 'ASC' | 'DESC';
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly categories: CategoriesService,
  ) {}

  // ---------- /api/categories/:slug/products ---------------------------------

  async listByCategory(
    slug: string,
    opts: { sort?: string; manufacturer?: string; maxPrice?: number; page: number; size: number },
  ): Promise<PagedResult<ProductDto>> {
    const cat = await this.categories.getRowBySlugOrFail(slug);
    const keyField = cat.key_metrics_schema?.key_metric?.field;
    if (!keyField || !SAFE_IDENT.test(keyField)) {
      throw new BadRequestException(`Category '${slug}' has no valid key_metric.field`);
    }
    const keyHigherIsBetter = cat.key_metrics_schema?.key_metric?.higher_is_better ?? true;

    const sortSpec = this.resolveSort(opts.sort, cat, keyField, keyHigherIsBetter);

    const whereParts: string[] = [`p.category_id = $1`, `p.status = 'approved'`];
    const params: unknown[] = [cat.id];
    if (opts.manufacturer) {
      params.push(opts.manufacturer);
      whereParts.push(`m.name = $${params.length}`);
    }
    if (opts.maxPrice != null) {
      params.push(opts.maxPrice);
      whereParts.push(`p.avg_online_price <= $${params.length}`);
    }
    const where = whereParts.join(' AND ');

    // Rank/total/avg are always computed against the key_metric of THIS category,
    // independent of the user-selected sort.
    const keyExpr = `(p.key_metrics->>'${keyField}')::numeric`;
    const rankExpr = `RANK() OVER (ORDER BY ${keyExpr} ${keyHigherIsBetter ? 'DESC' : 'ASC'} NULLS LAST)`;

    params.push(opts.size);
    const sizeIdx = params.length;
    params.push((opts.page - 1) * opts.size);
    const offsetIdx = params.length;

    const sql = `
      WITH ranked AS (
        SELECT
          ${PRODUCT_SELECT},
          ${rankExpr}                                AS metric_rank,
          COUNT(*) OVER ()                           AS total_count,
          AVG(${keyExpr}) OVER ()                    AS avg_metric,
          ${sortSpec.expr}                           AS __sort_key
        FROM products p
        JOIN manufacturers m ON m.id = p.manufacturer_id
        JOIN categories    c ON c.id = p.category_id
        WHERE ${where}
      )
      SELECT * FROM ranked
      ORDER BY __sort_key ${sortSpec.direction} NULLS LAST, name ASC
      LIMIT $${sizeIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await this.db.query<ProductRow>(sql, params);
    const items = rows.map(rowToProductDto);
    const total = rows.length > 0 ? Number((rows[0] as ProductRow).total_count ?? 0) : 0;

    return { items, total, page: opts.page, size: opts.size };
  }

  // ---------- /api/products/:id ---------------------------------------------

  async findById(id: string): Promise<ProductDto> {
    if (!UUID_RE.test(id)) {
      throw new BadRequestException('Invalid product id');
    }

    const detail = await this.db.query<ProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM products p
       JOIN manufacturers m ON m.id = p.manufacturer_id
       JOIN categories    c ON c.id = p.category_id
       WHERE p.id = $1 AND p.status = 'approved'`,
      [id],
    );

    const row = detail.rows[0];
    if (!row) throw new NotFoundException(`Product '${id}' not found`);

    const cat = await this.categories.findRowBySlug(row.c_slug);
    const keyField = cat?.key_metrics_schema?.key_metric?.field;
    const keyHigherIsBetter = cat?.key_metrics_schema?.key_metric?.higher_is_better ?? true;

    const dto = rowToProductDto(row);
    if (cat && keyField && SAFE_IDENT.test(keyField)) {
      const stats = await this.computeCategoryStats(id, cat.id, keyField, keyHigherIsBetter);
      if (stats) dto.categoryStats = stats;
    }
    return dto;
  }

  // ---------- /api/products/compare ?ids=a,b,c -------------------------------

  async compare(idsCsv: string): Promise<ProductDto[]> {
    const ids = idsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length < 2 || ids.length > 3) {
      throw new BadRequestException('compare requires 2 or 3 product ids');
    }
    for (const id of ids) {
      if (!UUID_RE.test(id)) throw new BadRequestException(`Invalid product id: ${id}`);
    }

    const { rows } = await this.db.query<ProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM products p
       JOIN manufacturers m ON m.id = p.manufacturer_id
       JOIN categories    c ON c.id = p.category_id
       WHERE p.id = ANY($1::uuid[]) AND p.status = 'approved'`,
      [ids],
    );

    // Preserve the order the caller asked for.
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids
      .map((id) => byId.get(id))
      .filter((r): r is ProductRow => r !== undefined)
      .map(rowToProductDto);
  }

  // ---------- /api/products/search ?q=... -----------------------------------

  async search(q: string, limit: number): Promise<ProductDto[]> {
    const pattern = `%${q}%`;
    const { rows } = await this.db.query<ProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM products p
       JOIN manufacturers m ON m.id = p.manufacturer_id
       JOIN categories    c ON c.id = p.category_id
       WHERE p.status = 'approved'
         AND (p.name ILIKE $1 OR m.name ILIKE $1)
       ORDER BY
         CASE WHEN p.name ILIKE $1 THEN 0 ELSE 1 END,
         p.name ASC
       LIMIT $2`,
      [pattern, limit],
    );
    return rows.map(rowToProductDto);
  }

  // ---------- helpers --------------------------------------------------------

  private resolveSort(
    raw: string | undefined,
    cat: CategoryRow,
    keyField: string,
    keyHigherIsBetter: boolean,
  ): SortSpec {
    const allowed = new Set<string>(
      (cat.key_metrics_schema?.sortable_fields ?? []).map((f) => f.field),
    );
    // The category key metric is always sortable, even if not listed.
    allowed.add(`key_metrics.${keyField}`);

    const defaultSpec: SortSpec = {
      expr: `(p.key_metrics->>'${keyField}')::numeric`,
      direction: keyHigherIsBetter ? 'DESC' : 'ASC',
    };
    if (!raw) return defaultSpec;

    const [fieldRaw, dirRaw] = raw.split(':');
    const field = fieldRaw?.trim();
    const dir = (dirRaw?.trim().toLowerCase() === 'asc' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    if (!field || !allowed.has(field)) {
      throw new BadRequestException(`Sort field '${field}' is not allowed for this category`);
    }

    if (field.startsWith('key_metrics.')) {
      const k = field.slice('key_metrics.'.length);
      if (!SAFE_IDENT.test(k)) throw new BadRequestException(`Invalid sort field '${field}'`);
      return { expr: `(p.key_metrics->>'${k}')::numeric`, direction: dir };
    }
    if (field.startsWith('nutrition.')) {
      const k = field.slice('nutrition.'.length);
      if (!SAFE_IDENT.test(k)) throw new BadRequestException(`Invalid sort field '${field}'`);
      return { expr: `(p.nutrition->>'${k}')::numeric`, direction: dir };
    }
    if (field === 'avg_online_price' || field === 'msrp') {
      return { expr: `p.${field}`, direction: dir };
    }
    throw new BadRequestException(`Unsupported sort field '${field}'`);
  }

  private async computeCategoryStats(
    productId: string,
    categoryId: string,
    keyField: string,
    higherIsBetter: boolean,
  ): Promise<{ rank: number; total: number; avgKeyMetric: number } | null> {
    const keyExpr = `(key_metrics->>'${keyField}')::numeric`;
    const { rows } = await this.db.query<{
      metric_rank: string;
      total_count: string;
      avg_metric: string | null;
    }>(
      `WITH ranked AS (
         SELECT
           id,
           RANK() OVER (ORDER BY ${keyExpr} ${higherIsBetter ? 'DESC' : 'ASC'} NULLS LAST) AS metric_rank,
           COUNT(*)         OVER () AS total_count,
           AVG(${keyExpr})  OVER () AS avg_metric
         FROM products
         WHERE category_id = $1 AND status = 'approved'
       )
       SELECT metric_rank, total_count, avg_metric FROM ranked WHERE id = $2`,
      [categoryId, productId],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      rank: Number(r.metric_rank),
      total: Number(r.total_count),
      avgKeyMetric: r.avg_metric != null ? Number(r.avg_metric) : 0,
    };
  }
}
