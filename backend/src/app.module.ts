import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { InsightsModule } from './insights/insights.module';
import { ProductRequestsModule } from './product-requests/product-requests.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CategoriesModule,
    ProductsModule,
    InsightsModule,
    ProductRequestsModule,
    AdminModule,
  ],
})
export class AppModule {}
