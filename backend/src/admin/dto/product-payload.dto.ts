import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductVolumeDto {
  @IsNumber()
  @Min(0)
  value!: number;

  @IsIn(['g', 'ml', 'ea'])
  unit!: 'g' | 'ml' | 'ea';
}

export class IngredientPartDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pct?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  origin?: string;
}

export class IngredientsDto {
  @IsString()
  @MaxLength(5000)
  rawText!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => IngredientPartDto)
  parsed!: IngredientPartDto[];
}

export class NutritionDto {
  @IsIn(['100g', '100ml', 'serving'])
  baseUnit!: '100g' | '100ml' | 'serving';

  @IsNumber()
  @Min(0)
  baseAmount!: number;

  @IsOptional() @IsNumber() @Min(0) kcal?: number;
  @IsOptional() @IsNumber() @Min(0) protein?: number;
  @IsOptional() @IsNumber() @Min(0) carb?: number;
  @IsOptional() @IsNumber() @Min(0) sugar?: number;
  @IsOptional() @IsNumber() @Min(0) fat?: number;
  @IsOptional() @IsNumber() @Min(0) saturatedFat?: number;
  @IsOptional() @IsNumber() @Min(0) sodium?: number;
  @IsOptional() @IsNumber() @Min(0) cholesterol?: number;
}

/// Full product payload. Used for both POST (create) and PUT (full replace);
/// PATCH-style partial updates are not supported in the MVP admin.
export class ProductPayloadDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{8,13}$/, { message: 'barcode must be 8-13 digits' })
  barcode?: string;

  @IsString()
  @Length(1, 200)
  name!: string;

  @IsUUID()
  manufacturerId!: string;

  @IsUUID()
  categoryId!: string;

  @ValidateNested()
  @Type(() => ProductVolumeDto)
  volume!: ProductVolumeDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  msrp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  avgOnlinePrice?: number;

  @ValidateNested()
  @Type(() => IngredientsDto)
  ingredients!: IngredientsDto;

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  additives!: string[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  allergens!: string[];

  @ValidateNested()
  @Type(() => NutritionDto)
  nutrition!: NutritionDto;

  // Free-form per category. Values must be numbers or booleans; the service
  // sanity-checks the shape before insert/update. @Allow keeps the field from
  // being stripped by ValidationPipe's whitelist.
  @Allow()
  keyMetrics!: Record<string, number | boolean>;

  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  productImages!: string[];

  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  labelImages!: string[];

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';
}

export class UpdateStatusDto {
  @IsIn(['pending', 'approved', 'rejected'])
  status!: 'pending' | 'approved' | 'rejected';
}

export class ListAdminProductsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'any'])
  status?: 'pending' | 'approved' | 'rejected' | 'any';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 30;
}
