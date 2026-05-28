import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { CompareQueryDto } from './dto/compare.query.dto';
import { SearchQueryDto } from './dto/search.query.dto';
import type { PagedResult, ProductDto } from '../common/types';

@Controller()
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  // Note: keep /products/compare and /products/search BEFORE /products/:id
  // so Nest's router matches the static segments first.
  @Get('products/compare')
  compare(@Query() q: CompareQueryDto): Promise<ProductDto[]> {
    return this.service.compare(q.ids);
  }

  @Get('products/search')
  search(@Query() q: SearchQueryDto): Promise<ProductDto[]> {
    return this.service.search(q.q, q.limit ?? 20);
  }

  @Get('products/:id')
  findOne(@Param('id') id: string): Promise<ProductDto> {
    return this.service.findById(id);
  }

  @Get('categories/:slug/products')
  listByCategory(
    @Param('slug') slug: string,
    @Query() q: ListProductsQueryDto,
  ): Promise<PagedResult<ProductDto>> {
    return this.service.listByCategory(slug, {
      sort: q.sort,
      manufacturer: q.manufacturer,
      maxPrice: q.maxPrice,
      page: q.page ?? 1,
      size: q.size ?? 20,
    });
  }
}
