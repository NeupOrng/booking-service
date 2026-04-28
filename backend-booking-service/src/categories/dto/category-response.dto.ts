import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CategoryResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  @Expose() id: string;

  @ApiProperty({ example: 'Hair & Beauty' })
  @Expose() name: string;

  @ApiProperty({ example: 'hair-beauty' })
  @Expose() slug: string;

  @ApiProperty({ example: '#FF6B6B', nullable: true })
  @Expose() colorHex: string | null;

  @ApiProperty({ example: 1 })
  @Expose() sortOrder: number;

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
