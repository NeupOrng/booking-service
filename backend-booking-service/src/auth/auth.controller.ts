import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterBusinessOwnerDto } from './dto/register-business-owner.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Public endpoints ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Returns access token, refresh token, and user object' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 201, description: 'Returns access token, refresh token, and user object' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Rotate refresh token and get a new token pair' })
  @ApiResponse({ status: 201, description: 'Returns new access token and refresh token' })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid or expired' })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @ApiResponse({ status: 201, schema: { example: { message: 'Logged out' } } })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: { id: string }) {
    await this.authService.revokeAllTokens(user.id);
    return { message: 'Logged out' };
  }

  // ── Admin-only account provisioning ────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiResponse({ status: 201, description: 'Returns tokens and the newly created admin user' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @Post('register/admin')
  registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  @ApiOperation({ summary: 'Create a new business owner account with a business profile (admin only)' })
  @ApiResponse({ status: 201, description: 'Returns tokens, the new user, and the new business record' })
  @ApiResponse({ status: 409, description: 'Email or business slug already in use' })
  @ApiBearerAuth('access-token')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('register/business-owner')
  registerBusinessOwner(@Body() dto: RegisterBusinessOwnerDto) {
    return this.authService.registerBusinessOwner(dto);
  }
}
