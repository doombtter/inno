import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class InsightPayloadDto {
  // URL-safe slug: lowercase letters, digits, hyphens.
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'slug must be lowercase alphanumerics + hyphens',
  })
  slug!: string;

  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnail?: string;

  @IsString()
  @MaxLength(50000)
  bodyMarkdown!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  relatedProductIds!: string[];

  // Optional reference to a category by slug; cleared with empty string.
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categorySlug?: string | null;

  // ISO date string, e.g. "2026-05-28T10:00:00Z". Null/undefined keeps the
  // post as a draft.
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;
}

export class PublishInsightDto {
  // null → unpublish, ISO string → publish at that date.
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;
}

export class ListAdminInsightsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'any'])
  status?: 'draft' | 'published' | 'any';

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
