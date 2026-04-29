import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CustomerBookingListQueryDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'past', 'cancelled'] })
  @IsOptional()
  @IsIn(['upcoming', 'past', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  perPage?: number;
}

export class BusinessBookingListQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'confirmed', 'completed', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional() @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional() @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  perPage?: number;
}
