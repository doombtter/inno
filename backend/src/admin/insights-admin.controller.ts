import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators';
import {
  InsightPayloadDto,
  ListAdminInsightsQueryDto,
  PublishInsightDto,
} from './dto/insight.dto';
import {
  AdminInsightDto,
  InsightsAdminService,
} from './insights-admin.service';
import type { PagedResult } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller('admin/insights')
export class InsightsAdminController {
  constructor(private readonly service: InsightsAdminService) {}

  @Get()
  list(
    @Query() q: ListAdminInsightsQueryDto,
  ): Promise<PagedResult<AdminInsightDto>> {
    return this.service.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AdminInsightDto> {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() body: InsightPayloadDto): Promise<AdminInsightDto> {
    return this.service.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: InsightPayloadDto,
  ): Promise<AdminInsightDto> {
    return this.service.update(id, body);
  }

  // Toggling publish moves a post in/out of the public feed.
  // admin-only — same policy as product status.
  @Roles('admin')
  @Patch(':id/publish')
  publish(
    @Param('id') id: string,
    @Body() body: PublishInsightDto,
  ): Promise<AdminInsightDto> {
    return this.service.setPublishedAt(id, body.publishedAt ?? null);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
