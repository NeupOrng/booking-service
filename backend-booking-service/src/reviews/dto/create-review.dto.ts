import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'UUID of the service being reviewed' })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ description: 'UUID of the completed booking this review is linked to' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Amazing experience, highly recommend!', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
