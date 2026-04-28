import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FileResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  @Expose() id: string;

  @ApiProperty({ example: 'profile-photo.jpg' })
  @Expose() originalName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Expose() mimeType: string;

  @ApiProperty({ example: 204800, description: 'File size in bytes' })
  @Expose() sizeBytes: number;

  @ApiProperty()
  @Expose() createdAt: Date;

  constructor(partial: Partial<FileResponseDto>) {
    Object.assign(this, partial);
  }
}
