import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

export class CreateAvailabilityBlockDto {
  @ApiProperty({ example: '2026-05-01', description: 'Date to block in YYYY-MM-DD format' })
  @IsDateString()
  blockDate: string;

  @ApiPropertyOptional({
    example: '12:00',
    description: 'Block start time in HH:mm format. Omit (with endTime) to block the entire day.',
  })
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'Block end time (exclusive). Must be provided together with startTime.' })
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime?: string;

  @ApiPropertyOptional({ example: 'Public holiday' })
  @IsOptional() @IsString()
  reason?: string;
}
