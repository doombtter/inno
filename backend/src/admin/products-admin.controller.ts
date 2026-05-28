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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, Roles } from '../auth/decorators';
import type { JwtPayload } from '../auth/types';
import {
  AdminProductDto,
  ProductsAdminService,
} from './products-admin.service';
import {
  ListAdminProductsQueryDto,
  ProductPayloadDto,
  UpdateStatusDto,
} from './dto/product-payload.dto';
import { RevisionEntry, RevisionsService } from './revisions.service';
import type { PagedResult } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller('admin/products')
export class ProductsAdminController {
  constructor(
    private readonly service: ProductsAdminService,
    private readonly revisions: RevisionsService,
  ) {}

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

  @Get(':id/revisions')
  revisionsFor(@Param('id') id: string): Promise<RevisionEntry[]> {
    return this.revisions.list(id);
  }

  @Post()
  create(@Body() body: ProductPayloadDto): Promise<AdminProductDto> {
    return this.service.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: ProductPayloadDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AdminProductDto> {
    return this.service.update(id, body, user.sub);
  }

  // Status toggles (approve/reject) are admin-only — editors can input and
  // edit but not move products in/out of the public catalog.
  @Roles('admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AdminProductDto> {
    return this.service.updateStatus(id, body.status, user.sub);
  }
}
