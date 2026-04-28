import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @Get('me')
  async getMe(@CurrentUser() user: { id: string }): Promise<UserResponseDto> {
    const found = await this.usersService.findById(user.id);
    return new UserResponseDto(found);
  }

  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @UseGuards(ThrottlerGuard)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return new UserResponseDto(updated);
  }

  @ApiOperation({ summary: 'Soft-deactivate the current user account' })
  @ApiResponse({ status: 200, schema: { example: { message: 'Account deactivated' } } })
  @UseGuards(ThrottlerGuard)
  @Delete('me')
  async deleteMe(@CurrentUser() user: { id: string }): Promise<{ message: string }> {
    await this.usersService.deactivate(user.id);
    return { message: 'Account deactivated' };
  }
}
