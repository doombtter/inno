import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminTokenGuard } from './admin-token.guard';
import {
  AdminProductDto,
  ProductsAdminService,
} from './products-admin.service';
import {
  ListAdminProductsQueryDto,
  ProductPayloadDto,
  UpdateStatusDto,
} from './dto/product-payload.dto';
import type { PagedResult } from '../common/types';

@UseGuards(AdminTokenGuard)
@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly service: ProductsAdminService) {}

  @Get()
  list(
    @Query() q: ListAdminProductsQueryDto,
  ): Promise<PagedResult<AdminProductDto>> {
    return this.service.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AdminProductDto> {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() body: ProductPayloadDto): Promise<AdminProductDto> {
    return this.service.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: ProductPayloadDto,
  ): Promise<AdminProductDto> {
    return this.service.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ): Promise<AdminProductDto> {
    return this.service.updateStatus(id, body.status);
  }
}
