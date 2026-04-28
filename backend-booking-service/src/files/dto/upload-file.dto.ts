import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({ example: 'bookings', description: 'Storage subfolder inside the bucket' })
  @IsOptional()
  @IsString()
  subfolder?: string;
}
