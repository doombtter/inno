import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';

@Injectable()
export class ProductRequestsService {
  constructor(private readonly db: DatabaseService) {}

  async create(input: CreateProductRequestDto): Promise<{ id: string }> {
    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO product_requests (search_query, note, device_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.searchQuery ?? null, input.note ?? null, input.deviceId ?? null],
    );
    return { id: rows[0]!.id };
  }
}
