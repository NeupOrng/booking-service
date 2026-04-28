import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BusinessResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() ownerId: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() slug: string;
  @ApiProperty({ nullable: true }) @Expose() description: string | null;
  @ApiProperty({ nullable: true }) @Expose() address: string | null;
  @ApiProperty({ nullable: true }) @Expose() logoUrl: string | null;
  @ApiProperty({ nullable: true }) @Expose() phone: string | null;
  @ApiProperty() @Expose() status: string;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  constructor(partial: Partial<BusinessResponseDto>) {
    Object.assign(this, partial);
  }
}
