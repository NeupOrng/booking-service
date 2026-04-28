import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'UUID of the business this service belongs to' })
  @IsUUID()
  businessId: string;

  @ApiPropertyOptional({ description: 'UUID of the category (optional)' })
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Deep Tissue Massage' })
  @IsString() @MinLength(2) @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'A therapeutic massage targeting deeper muscle layers.' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 8500, description: 'Price in cents' })
  @IsInt() @Min(1)
  priceCents: number;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsInt() @Min(5)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional() @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'Free cancellation up to 24h before.' })
  @IsOptional() @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
