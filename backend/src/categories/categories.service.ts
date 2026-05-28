import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CategoryRow, rowToCategoryDto } from '../common/mappers';
import type { CategoryDto } from '../common/types';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<CategoryDto[]> {
    const { rows } = await this.db.query<CategoryRow>(
      `SELECT id, slug, name, key_metrics_schema, display_order, is_active
       FROM categories
       WHERE is_active = TRUE
       ORDER BY display_order ASC, name ASC`,
    );
    return rows.map(rowToCategoryDto);
  }

  async findRowBySlug(slug: string): Promise<CategoryRow | null> {
    const { rows } = await this.db.query<CategoryRow>(
      `SELECT id, slug, name, key_metrics_schema, display_order, is_active
       FROM categories
       WHERE slug = $1 AND is_active = TRUE`,
      [slug],
    );
    return rows[0] ?? null;
  }

  async getRowBySlugOrFail(slug: string): Promise<CategoryRow> {
    const cat = await this.findRowBySlug(slug);
    if (!cat) {
      throw new NotFoundException(`Category '${slug}' not found`);
    }
    return cat;
  }
}
