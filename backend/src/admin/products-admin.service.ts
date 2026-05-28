import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  ProductRow,
  rowToProductDto,
} from '../common/mappers';
import type { PagedResult, ProductDto } from '../common/types';
import {
  ListAdminProductsQueryDto,
  ProductPayloadDto,
} from './dto/product-payload.dto';

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
  c.slug AS c_slug, c.name AS c_name,
  p.status, p.created_at, p.updated_at
`;

interface AdminProductRow extends ProductRow {
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface AdminProductDto extends ProductDto {
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

function rowToAdminProductDto(row: AdminProductRow): AdminProductDto {
  return {
    ...rowToProductDto(row),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class ProductsAdminService {
  constructor(private readonly db: DatabaseService) {}

  async list(
    q: ListAdminProductsQueryDto,
  ): Promise<PagedResult<AdminProductDto>> {
    const where: string[] = ['1=1'];
    const params: unknown[] = [];

    if (q.status && q.status !== 'any') {
      params.push(q.status);
      where.push(`p.status = $${params.length}`);
    }
    if (q.category) {
      params.push(q.category);
      where.push(`c.slug = $${params.length}`);
    }
    if (q.q && q.q.trim()) {
      params.push(`%${q.q.trim()}%`);
      where.push(`(p.name ILIKE $${params.length} OR m.name ILIKE $${params.length})`);
    }

    const page = q.page ?? 1;
    const size = q.size ?? 30;
    params.push(size, (page - 1) * size);

    const sql = `
      SELECT ${PRODUCT_SELECT}, COUNT(*) OVER () AS total_count
      FROM products p
      JOIN manufacturers m ON m.id = p.manufacturer_id
      JOIN categories    c ON c.id = p.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.updated_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await this.db.query<AdminProductRow & { total_count: string }>(
      sql,
      params,
    );
    const items = rows.map(rowToAdminProductDto);
    const total = rows.length > 0 ? Number(rows[0]!.total_count) : 0;
    return { items, total, page, size };
  }

  async findById(id: string): Promise<AdminProductDto> {
    const { rows } = await this.db.query<AdminProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM products p
       JOIN manufacturers m ON m.id = p.manufacturer_id
       JOIN categories    c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException(`Product '${id}' not found`);
    return rowToAdminProductDto(row);
  }

  async create(dto: ProductPayloadDto): Promise<AdminProductDto> {
    await this.assertReferencesExist(dto.categoryId, dto.manufacturerId);
    this.validateKeyMetrics(dto.keyMetrics);

    if (dto.barcode) {
      const dup = await this.db.query<{ id: string }>(
        `SELECT id FROM products WHERE barcode = $1`,
        [dto.barcode],
      );
      if (dup.rows[0]) {
        throw new ConflictException(
          `Another product already uses barcode ${dto.barcode}`,
        );
      }
    }

    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO products (
         barcode, name, manufacturer_id, category_id,
         volume_value, volume_unit, msrp, avg_online_price,
         ingredients_raw_text, ingredients_parsed,
         additives, allergens,
         nutrition_base_unit, nutrition_base_amount, nutrition,
         key_metrics,
         product_images, label_images,
         status
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8,
         $9, $10::jsonb,
         $11::text[], $12::text[],
         $13, $14, $15::jsonb,
         $16::jsonb,
         $17::text[], $18::text[],
         $19
       ) RETURNING id`,
      [
        dto.barcode ?? null,
        dto.name,
        dto.manufacturerId,
        dto.categoryId,
        dto.volume.value,
        dto.volume.unit,
        dto.msrp ?? null,
        dto.avgOnlinePrice ?? null,
        dto.ingredients.rawText,
        JSON.stringify(dto.ingredients.parsed),
        dto.additives,
        dto.allergens,
        dto.nutrition.baseUnit,
        dto.nutrition.baseAmount,
        JSON.stringify(this.nutritionExtras(dto.nutrition)),
        JSON.stringify(dto.keyMetrics),
        dto.productImages,
        dto.labelImages,
        dto.status ?? 'pending',
      ],
    );

    return this.findById(rows[0]!.id);
  }

  async update(id: string, dto: ProductPayloadDto): Promise<AdminProductDto> {
    const existing = await this.findById(id);
    await this.assertReferencesExist(dto.categoryId, dto.manufacturerId);
    this.validateKeyMetrics(dto.keyMetrics);

    if (dto.barcode && dto.barcode !== existing.barcode) {
      const dup = await this.db.query<{ id: string }>(
        `SELECT id FROM products WHERE barcode = $1 AND id <> $2`,
        [dto.barcode, id],
      );
      if (dup.rows[0]) {
        throw new ConflictException(
          `Another product already uses barcode ${dto.barcode}`,
        );
      }
    }

    await this.db.query(
      `UPDATE products SET
         barcode = $1,
         name = $2,
         manufacturer_id = $3,
         category_id = $4,
         volume_value = $5,
         volume_unit = $6,
         msrp = $7,
         avg_online_price = $8,
         ingredients_raw_text = $9,
         ingredients_parsed = $10::jsonb,
         additives = $11::text[],
         allergens = $12::text[],
         nutrition_base_unit = $13,
         nutrition_base_amount = $14,
         nutrition = $15::jsonb,
         key_metrics = $16::jsonb,
         product_images = $17::text[],
         label_images = $18::text[],
         status = COALESCE($19, status)
       WHERE id = $20`,
      [
        dto.barcode ?? null,
        dto.name,
        dto.manufacturerId,
        dto.categoryId,
        dto.volume.value,
        dto.volume.unit,
        dto.msrp ?? null,
        dto.avgOnlinePrice ?? null,
        dto.ingredients.rawText,
        JSON.stringify(dto.ingredients.parsed),
        dto.additives,
        dto.allergens,
        dto.nutrition.baseUnit,
        dto.nutrition.baseAmount,
        JSON.stringify(this.nutritionExtras(dto.nutrition)),
        JSON.stringify(dto.keyMetrics),
        dto.productImages,
        dto.labelImages,
        dto.status ?? null,
        id,
      ],
    );

    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<AdminProductDto> {
    const r = await this.db.query(
      `UPDATE products SET status = $1 WHERE id = $2`,
      [status, id],
    );
    if (r.rowCount === 0) {
      throw new NotFoundException(`Product '${id}' not found`);
    }
    return this.findById(id);
  }

  // ---- helpers ------------------------------------------------------------

  private nutritionExtras(n: ProductPayloadDto['nutrition']): Record<string, number> {
    const out: Record<string, number> = {};
    const keys: Array<keyof typeof n> = [
      'kcal',
      'protein',
      'carb',
      'sugar',
      'fat',
      'saturatedFat',
      'sodium',
      'cholesterol',
    ];
    for (const k of keys) {
      const v = n[k];
      if (typeof v === 'number') out[k as string] = v;
    }
    return out;
  }

  private validateKeyMetrics(km: Record<string, unknown>): void {
    if (km === null || typeof km !== 'object') {
      throw new BadRequestException('keyMetrics must be an object');
    }
    for (const [k, v] of Object.entries(km)) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) {
        throw new BadRequestException(`keyMetrics key '${k}' is invalid`);
      }
      if (typeof v !== 'number' && typeof v !== 'boolean') {
        throw new BadRequestException(
          `keyMetrics.${k} must be a number or boolean`,
        );
      }
    }
  }

  private async assertReferencesExist(
    categoryId: string,
    manufacturerId: string,
  ): Promise<void> {
    const r = await this.db.query<{ kind: string }>(
      `SELECT 'category' AS kind FROM categories WHERE id = $1
       UNION ALL
       SELECT 'manufacturer'    FROM manufacturers WHERE id = $2`,
      [categoryId, manufacturerId],
    );
    const found = new Set(r.rows.map((x) => x.kind));
    if (!found.has('category')) {
      throw new BadRequestException(`Unknown categoryId '${categoryId}'`);
    }
    if (!found.has('manufacturer')) {
      throw new BadRequestException(`Unknown manufacturerId '${manufacturerId}'`);
    }
  }
}
