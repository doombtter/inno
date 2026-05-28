import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ManufacturerDto {
  id: string;
  name: string;
  aliases: string[];
}

@Injectable()
export class ManufacturersAdminService {
  constructor(private readonly db: DatabaseService) {}

  async list(q?: string, limit = 30): Promise<ManufacturerDto[]> {
    if (q && q.trim()) {
      const { rows } = await this.db.query<{
        id: string;
        name: string;
        aliases: string[] | null;
      }>(
        `SELECT id, name, aliases
         FROM manufacturers
         WHERE name ILIKE $1 OR EXISTS (
           SELECT 1 FROM UNNEST(aliases) a WHERE a ILIKE $1
         )
         ORDER BY name ASC
         LIMIT $2`,
        [`%${q.trim()}%`, limit],
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        aliases: r.aliases ?? [],
      }));
    }

    const { rows } = await this.db.query<{
      id: string;
      name: string;
      aliases: string[] | null;
    }>(
      `SELECT id, name, aliases
       FROM manufacturers
       ORDER BY name ASC
       LIMIT $1`,
      [limit],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      aliases: r.aliases ?? [],
    }));
  }

  async create(name: string): Promise<ManufacturerDto> {
    const trimmed = name.trim();
    const dup = await this.db.query<{ id: string; name: string }>(
      `SELECT id, name FROM manufacturers WHERE name = $1`,
      [trimmed],
    );
    if (dup.rows[0]) {
      throw new ConflictException(`Manufacturer '${trimmed}' already exists`);
    }
    const { rows } = await this.db.query<{ id: string; name: string }>(
      `INSERT INTO manufacturers (name) VALUES ($1) RETURNING id, name`,
      [trimmed],
    );
    return { id: rows[0]!.id, name: rows[0]!.name, aliases: [] };
  }
}
