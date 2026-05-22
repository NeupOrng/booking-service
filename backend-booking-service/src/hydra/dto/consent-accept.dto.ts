import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConsentAcceptDto {
  @ApiProperty({ example: 'xyz789...' })
  @IsString()
  @IsNotEmpty()
  consent_challenge: string;

  @ApiProperty({ example: ['openid', 'profile', 'email'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  grant_scopes: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  remember: boolean;

  @ApiPropertyOptional({ example: 3600, description: 'Seconds to remember consent (0 = session)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remember_for?: number;
}
