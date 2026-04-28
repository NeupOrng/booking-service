import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Request } from 'express';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { businesses, users, refreshTokens, oauthAccounts, SelectBusiness, SelectUser } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterBusinessOwnerDto } from './dto/register-business-owner.dto';
import { LoginDto } from './dto/login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramStrategy } from './strategies/telegram.strategy';

type TokenPair = { accessToken: string; refreshToken: string };
type SafeUser  = Omit<SelectUser, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private dbService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private telegramStrategy: TelegramStrategy,
    @Inject(REQUEST) private req: Request,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair & { user: SafeUser }> {
    const existingUser = await this.dbService.db
      .select().from(users).where(eq(users.email, dto.email)).limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.dbService.db.insert(users).values({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    }).returning();

    const tokens = await this.issueTokens(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;

    return { ...tokens, user: safeUser };
  }

  async registerAdmin(dto: RegisterAdminDto): Promise<TokenPair & { user: SafeUser }> {
    const existing = await this.dbService.db
      .select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (existing.length > 0) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.dbService.db
      .insert(users)
      .values({ email: dto.email, passwordHash, fullName: dto.fullName, role: 'admin' })
      .returning();

    const tokens = await this.issueTokens(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;
    return { ...tokens, user: safeUser };
  }

  async registerBusinessOwner(
    dto: RegisterBusinessOwnerDto,
  ): Promise<TokenPair & { user: SafeUser; business: SelectBusiness }> {
    const existing = await this.dbService.db
      .select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (existing.length > 0) throw new ConflictException('Email already in use');

    const slugTaken = await this.dbService.db
      .select().from(businesses).where(eq(businesses.slug, dto.businessSlug)).limit(1);
    if (slugTaken.length > 0) throw new ConflictException('Business slug already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const { user, business } = await this.dbService.db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({ email: dto.email, passwordHash, fullName: dto.fullName, role: 'business_owner' })
        .returning();

      const [newBusiness] = await tx
        .insert(businesses)
        .values({
          ownerId:     newUser.id,
          name:        dto.businessName,
          slug:        dto.businessSlug,
          description: dto.businessDescription,
          address:     dto.businessAddress,
          phone:       dto.businessPhone,
        })
        .returning();

      return { user: newUser, business: newBusiness };
    });

    const tokens = await this.issueTokens(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;
    return { ...tokens, user: safeUser, business };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: SafeUser }> {
    const [user] = await this.dbService.db
      .select().from(users).where(eq(users.email, dto.email)).limit(1);

    if (!user || user.isActive === false || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;

    return { ...tokens, user: safeUser };
  }

  async issueTokens(userId: string, role: string): Promise<TokenPair> {
    const privateKey = this.configService.get<string>('jwt.privateKey');
    const accessExpiry = this.configService.get<string>('jwt.accessExpiry') || '15m';

    const accessToken = this.jwtService.sign(
      { sub: userId, role },
      { expiresIn: accessExpiry as any, algorithm: 'RS256', privateKey }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // 30 days expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const ipAddress = this.req.ip || '';
    const userAgent = this.req.headers['user-agent'] || '';

    await this.dbService.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(rawToken: string): Promise<TokenPair> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();

    const [tokenRecord] = await this.dbService.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          eq(refreshTokens.isRevoked, false)
        )
      )
      .limit(1);

    if (!tokenRecord || tokenRecord.expiresAt < now) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // rotation - delete old row
    await this.dbService.db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id));

    // get user to get role
    const [user] = await this.dbService.db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    return this.issueTokens(user.id, user.role);
  }

  async revokeAllTokens(userId: string): Promise<void> {
    await this.dbService.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async findOrCreateOAuthUser(
    provider: 'google' | 'telegram', 
    providerUserId: string, 
    profile: { email?: string; fullName: string; avatarUrl?: string }
  ): Promise<SelectUser> {
    // 1. Check if linked account exists
    const [existingLink] = await this.dbService.db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerUserId, providerUserId)
        )
      )
      .limit(1);

    if (existingLink) {
      const [user] = await this.dbService.db.select().from(users).where(eq(users.id, existingLink.userId)).limit(1);
      if (user) return user;
    }

    // 2. Wrap creation in transaction
    return await this.dbService.db.transaction(async (tx) => {
      let userRecord: SelectUser;

      if (profile.email) {
        const [existingUserByEmail] = await tx.select().from(users).where(eq(users.email, profile.email)).limit(1);
        if (existingUserByEmail) {
          userRecord = existingUserByEmail;
        }
      }

      if (!userRecord) {
        const isEmailVerified = provider === 'google';
        const [newUser] = await tx.insert(users).values({
          email: profile.email || `${providerUserId}@${provider}.local`, // fallback if no email
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          role: 'customer',
          isEmailVerified,
        }).returning();
        userRecord = newUser;
      }

      await tx.insert(oauthAccounts).values({
        userId: userRecord.id,
        provider,
        providerUserId,
      });

      return userRecord;
    });
  }

  async handleTelegramAuth(dto: TelegramAuthDto): Promise<TokenPair & { user: SafeUser }> {
    if (!this.telegramStrategy.verify(dto)) {
      throw new UnauthorizedException('Telegram auth data is invalid');
    }

    const user = await this.findOrCreateOAuthUser('telegram', dto.id.toString(), {
      fullName: dto.first_name + (dto.last_name ? ` ${dto.last_name}` : ''),
      avatarUrl: dto.photo_url,
    });

    const tokens = await this.issueTokens(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;

    return { ...tokens, user: safeUser };
  }
}
