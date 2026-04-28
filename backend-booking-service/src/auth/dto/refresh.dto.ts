import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Raw refresh token received at login/register' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
