import { Controller, Get, Param } from '@nestjs/common';
import { InsightsService } from './insights.service';
import type { InsightDto } from '../common/types';

@Controller('content/insights')
export class InsightsController {
  constructor(private readonly service: InsightsService) {}

  @Get()
  list(): Promise<InsightDto[]> {
    return this.service.list();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<InsightDto> {
    return this.service.findBySlug(slug);
  }
}
