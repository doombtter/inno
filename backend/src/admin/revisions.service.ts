import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { AdminProductDto } from './products-admin.service';

export interface RevisionEntry {
  id: string;
  productId: string;
  changedBy: { id: string; name: string; email: string } | null;
  changes: Record<string, [unknown, unknown]>;
  reason: string | null;
  createdAt: string;
}

/// Fields that get diffed on PUT. Anything not in this list is ignored even if
/// it changed, because it's either derived (createdAt) or noisy
/// (updatedAt jitters on every save).
const DIFFABLE_FIELDS: Array<keyof AdminProductDto> = [
  'barcode',
  'name',
  'status',
  'additives',
  'allergens',
  'keyMetrics',
  'ingredients',
  'nutrition',
  'volume',
  'price',
  'images',
  // manufacturer / category are ref objects; we diff their stable handle below.
];

@Injectable()
export class RevisionsService {
  constructor(private readonly db: DatabaseService) {}

  /// Record a revision unless the diff is empty.
  async record(
    productId: string,
    before: AdminProductDto,
    after: AdminProductDto,
    changedByUserId: string,
    reason?: string,
  ): Promise<void> {
    const changes = this.diff(before, after);
    if (Object.keys(changes).length === 0) return;

    await this.db.query(
      `INSERT INTO product_revisions (product_id, changed_by, changes, reason)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [productId, changedByUserId, JSON.stringify(changes), reason ?? null],
    );
  }

  async list(productId: string): Promise<RevisionEntry[]> {
    const { rows } = await this.db.query<{
      id: string;
      product_id: string;
      changed_by: string | null;
      changes: Record<string, [unknown, unknown]>;
      reason: string | null;
      created_at: Date;
      changed_by_name: string | null;
      changed_by_email: string | null;
    }>(
      `SELECT r.id, r.product_id, r.changed_by, r.changes, r.reason, r.created_at,
              u.name  AS changed_by_name,
              u.email AS changed_by_email
       FROM product_revisions r
       LEFT JOIN users u ON u.id = r.changed_by
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId],
    );
    return rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      changedBy:
        r.changed_by && r.changed_by_name && r.changed_by_email
          ? {
              id: r.changed_by,
              name: r.changed_by_name,
              email: r.changed_by_email,
            }
          : null,
      changes: r.changes,
      reason: r.reason,
      createdAt: r.created_at.toISOString(),
    }));
  }

  private diff(
    before: AdminProductDto,
    after: AdminProductDto,
  ): Record<string, [unknown, unknown]> {
    const out: Record<string, [unknown, unknown]> = {};
    for (const k of DIFFABLE_FIELDS) {
      const a = before[k];
      const b = after[k];
      if (!this.deepEqual(a, b)) {
        out[k as string] = [a, b];
      }
    }
    if (before.manufacturer.id !== after.manufacturer.id) {
      out.manufacturer = [before.manufacturer, after.manufacturer];
    }
    if (before.category.slug !== after.category.slug) {
      out.category = [before.category, after.category];
    }
    return out;
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((v, i) => this.deepEqual(v, b[i]));
    }
    if (Array.isArray(b)) return false;
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
    for (const k of keys) {
      if (!this.deepEqual(ao[k], bo[k])) return false;
    }
    return true;
  }
}
