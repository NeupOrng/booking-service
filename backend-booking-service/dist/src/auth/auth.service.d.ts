import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { SelectBusiness, SelectUser } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterBusinessOwnerDto } from './dto/register-business-owner.dto';
import { LoginDto } from './dto/login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramStrategy } from './strategies/telegram.strategy';
type TokenPair = {
    accessToken: string;
    refreshToken: string;
};
type SafeUser = Omit<SelectUser, 'passwordHash'>;
export declare class AuthService {
    private dbService;
    private jwtService;
    private configService;
    private telegramStrategy;
    private req;
    constructor(dbService: DatabaseService, jwtService: JwtService, configService: ConfigService, telegramStrategy: TelegramStrategy, req: Request);
    register(dto: RegisterDto): Promise<TokenPair & {
        user: SafeUser;
    }>;
    registerAdmin(dto: RegisterAdminDto): Promise<TokenPair & {
        user: SafeUser;
    }>;
    registerBusinessOwner(dto: RegisterBusinessOwnerDto): Promise<TokenPair & {
        user: SafeUser;
        business: SelectBusiness;
    }>;
    login(dto: LoginDto): Promise<TokenPair & {
        user: SafeUser;
    }>;
    issueTokens(userId: string, role: string): Promise<TokenPair>;
    refreshTokens(rawToken: string): Promise<TokenPair>;
    revokeAllTokens(userId: string): Promise<void>;
    findOrCreateOAuthUser(provider: 'google' | 'telegram', providerUserId: string, profile: {
        email?: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<SelectUser>;
    handleTelegramAuth(dto: TelegramAuthDto): Promise<TokenPair & {
        user: SafeUser;
    }>;
}
export {};
