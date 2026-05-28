import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type { CategoryDto } from '../common/types';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  list(): Promise<CategoryDto[]> {
    return this.service.list();
  }
}
