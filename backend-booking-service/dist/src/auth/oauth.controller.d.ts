import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
export declare class OAuthController {
    private readonly authService;
    private configService;
    constructor(authService: AuthService, configService: ConfigService);
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: Request, res: Response): Promise<void>;
    telegramAuth(dto: TelegramAuthDto): Promise<{
        accessToken: string;
        refreshToken: string;
    } & {
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string;
            role: string;
            isActive: boolean;
            isEmailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
