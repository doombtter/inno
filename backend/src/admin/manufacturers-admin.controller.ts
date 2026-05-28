import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from './admin-token.guard';
import {
  CreateManufacturerDto,
  ListManufacturersQueryDto,
} from './dto/manufacturer.dto';
import {
  ManufacturerDto,
  ManufacturersAdminService,
} from './manufacturers-admin.service';

@UseGuards(AdminTokenGuard)
@Controller('admin/manufacturers')
export class ManufacturersAdminController {
  constructor(private readonly service: ManufacturersAdminService) {}

  @Get()
  list(@Query() q: ListManufacturersQueryDto): Promise<ManufacturerDto[]> {
    return this.service.list(q.q, q.limit ?? 30);
  }

  @Post()
  create(@Body() body: CreateManufacturerDto): Promise<ManufacturerDto> {
    return this.service.create(body.name);
  }
}
