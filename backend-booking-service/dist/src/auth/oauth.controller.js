"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const telegram_auth_dto_1 = require("./dto/telegram-auth.dto");
let OAuthController = class OAuthController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async googleAuth() {
    }
    async googleAuthRedirect(req, res) {
        const user = req.user;
        const tokens = await this.authService.issueTokens(user.id, user.role);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
    }
    async telegramAuth(dto) {
        return this.authService.handleTelegramAuth(dto);
    }
};
__decorate([
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "googleAuth", null);
__decorate([
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "googleAuthRedirect", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Log in or register via Telegram Login Widget' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Returns access token, refresh token, and user object' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Telegram auth data is invalid' }),
    (0, common_1.Post)('telegram'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegram_auth_dto_1.TelegramAuthDto]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "telegramAuth", null);
OAuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], OAuthController);
exports.OAuthController = OAuthController;
//# sourceMappingURL=oauth.controller.js.map