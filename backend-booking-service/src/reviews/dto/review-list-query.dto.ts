import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min, IsOptional } from 'class-validator';

export class ReviewListQueryDto {
  @ApiProperty({ description: 'Service UUID to fetch reviews for' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  perPage?: number;
}

export class ReviewStatsQueryDto {
  @ApiProperty({ description: 'Service UUID' })
  @IsUUID()
  serviceId: string;
}
