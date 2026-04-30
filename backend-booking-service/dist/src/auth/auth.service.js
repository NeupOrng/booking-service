"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
const telegram_strategy_1 = require("./strategies/telegram.strategy");
let AuthService = class AuthService {
    constructor(dbService, jwtService, configService, telegramStrategy, req) {
        this.dbService = dbService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.telegramStrategy = telegramStrategy;
        this.req = req;
    }
    async register(dto) {
        const existingUser = await this.dbService.db
            .select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, dto.email)).limit(1);
        if (existingUser.length > 0) {
            throw new common_1.ConflictException('Email already in use');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const [user] = await this.dbService.db.insert(schema_1.users).values({
            email: dto.email,
            passwordHash,
            fullName: dto.fullName,
        }).returning();
        const tokens = await this.issueTokens(user.id, user.role);
        const { passwordHash: _ } = user, safeUser = __rest(user, ["passwordHash"]);
        return Object.assign(Object.assign({}, tokens), { user: safeUser });
    }
    async registerAdmin(dto) {
        const existing = await this.dbService.db
            .select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, dto.email)).limit(1);
        if (existing.length > 0)
            throw new common_1.ConflictException('Email already in use');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const [user] = await this.dbService.db
            .insert(schema_1.users)
            .values({ email: dto.email, passwordHash, fullName: dto.fullName, role: 'admin' })
            .returning();
        const tokens = await this.issueTokens(user.id, user.role);
        const { passwordHash: _ } = user, safeUser = __rest(user, ["passwordHash"]);
        return Object.assign(Object.assign({}, tokens), { user: safeUser });
    }
    async registerBusinessOwner(dto) {
        const existing = await this.dbService.db
            .select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, dto.email)).limit(1);
        if (existing.length > 0)
            throw new common_1.ConflictException('Email already in use');
        const slugTaken = await this.dbService.db
            .select().from(schema_1.businesses).where((0, drizzle_orm_1.eq)(schema_1.businesses.slug, dto.businessSlug)).limit(1);
        if (slugTaken.length > 0)
            throw new common_1.ConflictException('Business slug already in use');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const { user, business } = await this.dbService.db.transaction(async (tx) => {
            const [newUser] = await tx
                .insert(schema_1.users)
                .values({ email: dto.email, passwordHash, fullName: dto.fullName, role: 'business_owner' })
                .returning();
            const [newBusiness] = await tx
                .insert(schema_1.businesses)
                .values({
                ownerId: newUser.id,
                name: dto.businessName,
                slug: dto.businessSlug,
                description: dto.businessDescription,
                address: dto.businessAddress,
                phone: dto.businessPhone,
            })
                .returning();
            return { user: newUser, business: newBusiness };
        });
        const tokens = await this.issueTokens(user.id, user.role);
        const { passwordHash: _ } = user, safeUser = __rest(user, ["passwordHash"]);
        return Object.assign(Object.assign({}, tokens), { user: safeUser, business });
    }
    async login(dto) {
        const [user] = await this.dbService.db
            .select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, dto.email)).limit(1);
        if (!user || user.isActive === false || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.issueTokens(user.id, user.role);
        const { passwordHash: _ } = user, safeUser = __rest(user, ["passwordHash"]);
        return Object.assign(Object.assign({}, tokens), { user: safeUser });
    }
    async issueTokens(userId, role) {
        const privateKey = this.configService.get('jwt.privateKey');
        const accessExpiry = this.configService.get('jwt.accessExpiry') || '15m';
        const accessToken = this.jwtService.sign({ sub: userId, role }, { expiresIn: accessExpiry, algorithm: 'RS256', privateKey });
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const ipAddress = this.req.ip || '';
        const userAgent = this.req.headers['user-agent'] || '';
        await this.dbService.db.insert(schema_1.refreshTokens).values({
            userId,
            tokenHash,
            expiresAt,
            ipAddress,
            userAgent,
        });
        return { accessToken, refreshToken };
    }
    async refreshTokens(rawToken) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const now = new Date();
        const [tokenRecord] = await this.dbService.db
            .select()
            .from(schema_1.refreshTokens)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.refreshTokens.tokenHash, tokenHash), (0, drizzle_orm_1.eq)(schema_1.refreshTokens.isRevoked, false)))
            .limit(1);
        if (!tokenRecord || tokenRecord.expiresAt < now) {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired');
        }
        await this.dbService.db.delete(schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.id, tokenRecord.id));
        const [user] = await this.dbService.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, tokenRecord.userId)).limit(1);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User is inactive or not found');
        }
        return this.issueTokens(user.id, user.role);
    }
    async revokeAllTokens(userId) {
        await this.dbService.db.delete(schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.userId, userId));
    }
    async findOrCreateOAuthUser(provider, providerUserId, profile) {
        const [existingLink] = await this.dbService.db
            .select()
            .from(schema_1.oauthAccounts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oauthAccounts.provider, provider), (0, drizzle_orm_1.eq)(schema_1.oauthAccounts.providerUserId, providerUserId)))
            .limit(1);
        if (existingLink) {
            const [user] = await this.dbService.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, existingLink.userId)).limit(1);
            if (user)
                return user;
        }
        return await this.dbService.db.transaction(async (tx) => {
            let userRecord;
            if (profile.email) {
                const [existingUserByEmail] = await tx.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, profile.email)).limit(1);
                if (existingUserByEmail) {
                    userRecord = existingUserByEmail;
                }
            }
            if (!userRecord) {
                const isEmailVerified = provider === 'google';
                const [newUser] = await tx.insert(schema_1.users).values({
                    email: profile.email || `${providerUserId}@${provider}.local`,
                    fullName: profile.fullName,
                    avatarUrl: profile.avatarUrl,
                    role: 'customer',
                    isEmailVerified,
                }).returning();
                userRecord = newUser;
            }
            await tx.insert(schema_1.oauthAccounts).values({
                userId: userRecord.id,
                provider,
                providerUserId,
            });
            return userRecord;
        });
    }
    async handleTelegramAuth(dto) {
        if (!this.telegramStrategy.verify(dto)) {
            throw new common_1.UnauthorizedException('Telegram auth data is invalid');
        }
        const user = await this.findOrCreateOAuthUser('telegram', dto.id.toString(), {
            fullName: dto.first_name + (dto.last_name ? ` ${dto.last_name}` : ''),
            avatarUrl: dto.photo_url,
        });
        const tokens = await this.issueTokens(user.id, user.role);
        const { passwordHash: _ } = user, safeUser = __rest(user, ["passwordHash"]);
        return Object.assign(Object.assign({}, tokens), { user: safeUser });
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService,
        config_1.ConfigService,
        telegram_strategy_1.TelegramStrategy, Object])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map