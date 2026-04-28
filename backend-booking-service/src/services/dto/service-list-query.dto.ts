import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ServiceListQueryDto {
  @ApiPropertyOptional({ description: 'Full-text search on service or business name' })
  @IsOptional() @IsString() q?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional() @IsUUID() categoryId?: string;

  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'duration_asc', 'soonest'] })
  @IsOptional() @IsIn(['price_asc', 'price_desc', 'duration_asc', 'soonest']) sort?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) perPage?: number;
}
