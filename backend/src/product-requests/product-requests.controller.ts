import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ProductRequestsService } from './product-requests.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';

@Controller('products/requests')
export class ProductRequestsController {
  constructor(private readonly service: ProductRequestsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateProductRequestDto): Promise<{ id: string }> {
    return this.service.create(body);
  }
}
