import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InsightRow, rowToInsightDto } from '../common/mappers';
import type { InsightDto } from '../common/types';

const INSIGHT_SELECT = `
  i.id, i.slug, i.title, i.subtitle, i.thumbnail,
  i.body_markdown, i.related_product_ids,
  c.slug AS c_slug, i.published_at
`;

@Injectable()
export class InsightsService {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<InsightDto[]> {
    const { rows } = await this.db.query<InsightRow>(
      `SELECT ${INSIGHT_SELECT}
       FROM insights i
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.published_at IS NOT NULL
       ORDER BY i.published_at DESC`,
    );
    return rows.map(rowToInsightDto);
  }

  async findBySlug(slug: string): Promise<InsightDto> {
    const { rows } = await this.db.query<InsightRow>(
      `SELECT ${INSIGHT_SELECT}
       FROM insights i
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.slug = $1 AND i.published_at IS NOT NULL`,
      [slug],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException(`Insight '${slug}' not found`);
    return rowToInsightDto(row);
  }
}
