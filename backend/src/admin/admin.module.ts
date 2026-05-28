import { Module } from '@nestjs/common';
import { ProductsAdminController } from './products-admin.controller';
import { ProductsAdminService } from './products-admin.service';
import { ManufacturersAdminController } from './manufacturers-admin.controller';
import { ManufacturersAdminService } from './manufacturers-admin.service';
import { AdminTokenGuard } from './admin-token.guard';

@Module({
  controllers: [ProductsAdminController, ManufacturersAdminController],
  providers: [
    ProductsAdminService,
    ManufacturersAdminService,
    AdminTokenGuard,
  ],
})
export class AdminModule {}
