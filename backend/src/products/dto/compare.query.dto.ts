import { IsString, MaxLength } from 'class-validator';

export class CompareQueryDto {
  // Comma-separated UUIDs, e.g. "a,b,c". 2-3 IDs are accepted.
  @IsString()
  @MaxLength(200)
  ids!: string;
}
