import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  @Expose() id: string;

  @ApiProperty({ example: 'alice@example.com', nullable: true })
  @Expose() email: string | null;

  @ApiProperty({ example: 'Alice Smith' })
  @Expose() fullName: string;

  @ApiProperty({ example: 'https://cdn.example.com/avatar.jpg', nullable: true })
  @Expose() avatarUrl: string | null;

  @ApiProperty({ example: 'customer', enum: ['customer', 'admin'] })
  @Expose() role: string;

  @ApiProperty({ example: true })
  @Expose() isActive: boolean;

  @ApiProperty({ example: false })
  @Expose() isEmailVerified: boolean;

  @ApiProperty()
  @Expose() createdAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
