import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchQuery?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
}
