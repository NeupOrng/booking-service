import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Hair & Beauty' })
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'hair-beauty', description: 'URL-safe slug, must be unique' })
  @IsString() @MinLength(2) @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: 'Everything hair and beauty related' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#FF6B6B', description: 'Hex colour including #' })
  @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'colorHex must be a valid hex colour e.g. #FF6B6B' })
  colorHex?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}
