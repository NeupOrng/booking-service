import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Service UUID' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2026-05-01', description: 'Booking date YYYY-MM-DD' })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ example: '09:00', description: 'Booking time HH:mm' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'bookingTime must be HH:mm' })
  bookingTime: string;

  @ApiPropertyOptional({ example: 'Please use the side entrance.' })
  @IsOptional()
  @IsString()
  notesFromCustomer?: string;
}
