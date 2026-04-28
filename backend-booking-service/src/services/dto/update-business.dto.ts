import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'Zen Spa' })
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'zen-spa', description: 'URL-safe slug, must be unique' })
  @IsOptional() @IsString() @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.jpg' })
  @IsOptional() @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '+61412345678' })
  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;
}
