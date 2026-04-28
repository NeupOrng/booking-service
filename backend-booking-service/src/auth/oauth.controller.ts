import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @ApiExcludeEndpoint()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles redirect
  }

  @ApiExcludeEndpoint()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    const tokens = await this.authService.issueTokens(user.id, user.role);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }

  @ApiOperation({ summary: 'Log in or register via Telegram Login Widget' })
  @ApiResponse({ status: 201, description: 'Returns access token, refresh token, and user object' })
  @ApiResponse({ status: 401, description: 'Telegram auth data is invalid' })
  @Post('telegram')
  async telegramAuth(@Body() dto: TelegramAuthDto) {
    return this.authService.handleTelegramAuth(dto);
  }
}
