import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: ['confirmed', 'completed'] })
  @IsIn(['confirmed', 'completed'])
  status: string;
}
