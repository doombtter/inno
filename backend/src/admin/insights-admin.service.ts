import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  InsightPayloadDto,
  ListAdminInsightsQueryDto,
} from './dto/insight.dto';
import type { PagedResult } from '../common/types';

export interface AdminInsightDto {
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

interface InsightRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  body_markdown: string;
  related_product_ids: string[] | null;
  category_id: string | null;
  c_slug: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const SELECT_COLS = `
  i.id, i.slug, i.title, i.subtitle, i.thumbnail,
  i.body_markdown, i.related_product_ids, i.category_id,
  c.slug AS c_slug,
  i.published_at, i.created_at, i.updated_at
`;

function toDto(row: InsightRow): AdminInsightDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    thumbnail: row.thumbnail,
    bodyMarkdown: row.body_markdown,
    relatedProductIds: row.related_product_ids ?? [],
    categorySlug: row.c_slug,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class InsightsAdminService {
  constructor(private readonly db: DatabaseService) {}

  async list(
    q: ListAdminInsightsQueryDto,
  ): Promise<PagedResult<AdminInsightDto>> {
    const where: string[] = ['1=1'];
    const params: unknown[] = [];

    if (q.status === 'published') where.push('i.published_at IS NOT NULL');
    if (q.status === 'draft') where.push('i.published_at IS NULL');
    if (q.q && q.q.trim()) {
      params.push(`%${q.q.trim()}%`);
      where.push(`(i.title ILIKE $${params.length} OR i.slug ILIKE $${params.length})`);
    }

    const page = q.page ?? 1;
    const size = q.size ?? 30;
    params.push(size, (page - 1) * size);

    const sql = `
      SELECT ${SELECT_COLS}, COUNT(*) OVER () AS total_count
      FROM insights i
      LEFT JOIN categories c ON c.id = i.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY i.updated_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await this.db.query<
      InsightRow & { total_count: string }
    >(sql, params);
    const items = rows.map(toDto);
    const total = rows[0] ? Number(rows[0].total_count) : 0;
    return { items, total, page, size };
  }

  async findById(id: string): Promise<AdminInsightDto> {
    const { rows } = await this.db.query<InsightRow>(
      `SELECT ${SELECT_COLS}
       FROM insights i
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException(`Insight '${id}' not found`);
    return toDto(row);
  }

  async create(dto: InsightPayloadDto): Promise<AdminInsightDto> {
    const categoryId = await this.resolveCategoryId(dto.categorySlug ?? null);
    await this.assertProductIdsExist(dto.relatedProductIds);

    const dup = await this.db.query<{ id: string }>(
      `SELECT id FROM insights WHERE slug = $1`,
      [dto.slug],
    );
    if (dup.rows[0]) {
      throw new ConflictException(`Insight slug '${dto.slug}' already exists`);
    }

    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO insights (
         slug, title, subtitle, thumbnail,
         body_markdown, related_product_ids,
         category_id, published_at
       ) VALUES ($1, $2, $3, $4, $5, $6::uuid[], $7, $8)
       RETURNING id`,
      [
        dto.slug,
        dto.title,
        dto.subtitle ?? null,
        dto.thumbnail ?? null,
        dto.bodyMarkdown,
        dto.relatedProductIds,
        categoryId,
        dto.publishedAt ?? null,
      ],
    );
    return this.findById(rows[0]!.id);
  }

  async update(id: string, dto: InsightPayloadDto): Promise<AdminInsightDto> {
    const existing = await this.findById(id);
    const categoryId = await this.resolveCategoryId(dto.categorySlug ?? null);
    await this.assertProductIdsExist(dto.relatedProductIds);

    if (dto.slug !== existing.slug) {
      const dup = await this.db.query<{ id: string }>(
        `SELECT id FROM insights WHERE slug = $1 AND id <> $2`,
        [dto.slug, id],
      );
      if (dup.rows[0]) {
        throw new ConflictException(
          `Another insight already uses slug '${dto.slug}'`,
        );
      }
    }

    await this.db.query(
      `UPDATE insights SET
         slug = $1,
         title = $2,
         subtitle = $3,
         thumbnail = $4,
         body_markdown = $5,
         related_product_ids = $6::uuid[],
         category_id = $7,
         published_at = $8
       WHERE id = $9`,
      [
        dto.slug,
        dto.title,
        dto.subtitle ?? null,
        dto.thumbnail ?? null,
        dto.bodyMarkdown,
        dto.relatedProductIds,
        categoryId,
        dto.publishedAt ?? null,
        id,
      ],
    );
    return this.findById(id);
  }

  async setPublishedAt(
    id: string,
    publishedAt: string | null,
  ): Promise<AdminInsightDto> {
    const r = await this.db.query(
      `UPDATE insights SET published_at = $1 WHERE id = $2`,
      [publishedAt, id],
    );
    if (r.rowCount === 0) {
      throw new NotFoundException(`Insight '${id}' not found`);
    }
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const r = await this.db.query(`DELETE FROM insights WHERE id = $1`, [id]);
    if (r.rowCount === 0) {
      throw new NotFoundException(`Insight '${id}' not found`);
    }
  }

  // ---- helpers ------------------------------------------------------------

  private async resolveCategoryId(
    slug: string | null,
  ): Promise<string | null> {
    if (!slug) return null;
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM categories WHERE slug = $1`,
      [slug],
    );
    if (!rows[0]) {
      throw new BadRequestException(`Unknown category slug '${slug}'`);
    }
    return rows[0].id;
  }

  private async assertProductIdsExist(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM products WHERE id = ANY($1::uuid[])`,
      [ids],
    );
    const found = new Set(rows.map((r) => r.id));
    for (const id of ids) {
      if (!found.has(id)) {
        throw new BadRequestException(`Unknown product id '${id}'`);
      }
    }
  }
}
