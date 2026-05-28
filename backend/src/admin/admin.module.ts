import { Module } from '@nestjs/common';
import { ProductsAdminController } from './products-admin.controller';
import { ProductsAdminService } from './products-admin.service';
import { ManufacturersAdminController } from './manufacturers-admin.controller';
import { ManufacturersAdminService } from './manufacturers-admin.service';
import { InsightsAdminController } from './insights-admin.controller';
import { InsightsAdminService } from './insights-admin.service';
import { RevisionsService } from './revisions.service';

@Module({
  controllers: [
    ProductsAdminController,
    ManufacturersAdminController,
    InsightsAdminController,
  ],
  providers: [
    ProductsAdminService,
    ManufacturersAdminService,
    InsightsAdminService,
    RevisionsService,
  ],
})
export class AdminModule {}
