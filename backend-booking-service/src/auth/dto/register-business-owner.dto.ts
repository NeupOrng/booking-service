import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterBusinessOwnerDto {
  // ── User account ────────────────────────────────────────────────────────────

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName: string;

  // ── Business profile ─────────────────────────────────────────────────────────

  @ApiProperty({ example: 'Zen Spa' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName: string;

  @ApiProperty({ example: 'zen-spa', description: 'URL-safe slug, must be unique across all businesses' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessSlug: string;

  @ApiPropertyOptional({ example: 'A luxury urban spa offering massage and wellness treatments.' })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiPropertyOptional({ example: '123 Calm Street, Melbourne VIC 3000' })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: '+61412345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  businessPhone?: string;
}
