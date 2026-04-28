import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({ description: 'Telegram user ID', example: 123456789 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  first_name: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'alice_tg' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Telegram profile photo URL' })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ description: 'Unix timestamp of auth (must be < 24h old)' })
  @IsNumber()
  auth_date: number;

  @ApiProperty({ description: 'HMAC-SHA256 signature from Telegram' })
  @IsString()
  hash: string;
}
