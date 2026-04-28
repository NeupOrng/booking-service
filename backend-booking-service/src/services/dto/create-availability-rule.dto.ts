import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

export class CreateAvailabilityRuleDto {
  @ApiProperty({ enum: DAYS, example: 'monday' })
  @IsIn(DAYS)
  dayOfWeek: string;

  @ApiProperty({ example: '09:00', description: 'Start time in HH:mm or HH:mm:ss format' })
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'End time in HH:mm or HH:mm:ss format (exclusive)' })
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime: string;

  @ApiProperty({ example: 60, description: 'Slot length in minutes (15–480)' })
  @IsInt() @Min(15) @Max(480)
  slotDurationMinutes: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Max concurrent bookings per slot. Overlapping rules on the same time take the MAX value.',
  })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  capacity?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
