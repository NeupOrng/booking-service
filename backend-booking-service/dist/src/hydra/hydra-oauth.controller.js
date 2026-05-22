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
exports.HydraOAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const hydra_service_1 = require("./hydra.service");
const login_challenge_dto_1 = require("./dto/login-challenge.dto");
const consent_accept_dto_1 = require("./dto/consent-accept.dto");
const kratos_frontend_service_1 = require("../kratos/kratos-frontend.service");
const kratos_identities_service_1 = require("../kratos/kratos-identities.service");
const SESSION_COOKIE = 'ory_kratos_session';
let HydraOAuthController = class HydraOAuthController {
    constructor(hydra, kratosFrontend, kratosIdentities, config) {
        var _a;
        this.hydra = hydra;
        this.kratosFrontend = kratosFrontend;
        this.kratosIdentities = kratosIdentities;
        this.config = config;
        this.frontendUrl =
            (_a = config.get('FRONTEND_URL')) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
    }
    async oauthLogin(challenge, res) {
        if (!challenge)
            throw new common_1.BadRequestException('login_challenge is required');
        const loginReq = await this.hydra.getLoginRequest(challenge);
        if (loginReq.skip) {
            const accepted = await this.hydra.acceptLoginRequest(challenge, {
                subject: loginReq.subject,
            });
            return res.redirect(accepted.redirect_to);
        }
        return res.redirect(`${this.frontendUrl}/auth/login?login_challenge=${challenge}`);
    }
    async completeLogin(dto, req) {
        var _a, _b;
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE];
        common_1.Logger.log(`[OAuth] token ${token}`);
        if (!token) {
            throw new common_1.BadRequestException('No active Kratos session. Complete login first.');
        }
        const { data: session } = await this.kratosFrontend.getSession(token);
        common_1.Logger.log(`[OAuth] session ${JSON.stringify(session)}`);
        if (!(session === null || session === void 0 ? void 0 : session.active) || !((_b = session === null || session === void 0 ? void 0 : session.identity) === null || _b === void 0 ? void 0 : _b.id)) {
            throw new common_1.BadRequestException('Kratos session is inactive or missing identity');
        }
        common_1.Logger.log(`[OAuth] dto ${JSON.stringify(dto)}`);
        const accepted = await this.hydra.acceptLoginRequest(dto.login_challenge, {
            subject: session.identity.id,
            remember: true,
            remember_for: 3600,
        });
        return { redirect_to: accepted.redirect_to };
    }
    async oauthConsent(challenge, res) {
        var _a, _b;
        if (!challenge)
            throw new common_1.BadRequestException('consent_challenge is required');
        const consentReq = await this.hydra.getConsentRequest(challenge);
        if (consentReq.skip) {
            const accepted = await this.hydra.acceptConsentRequest(challenge, {
                grant_scope: (_a = consentReq.requested_scope) !== null && _a !== void 0 ? _a : [],
                grant_access_token_audience: (_b = consentReq.requested_access_token_audience) !== null && _b !== void 0 ? _b : [],
                remember: true,
                remember_for: 3600,
            });
            return res.redirect(accepted.redirect_to);
        }
        return res.redirect(`${this.frontendUrl}/auth/consent?consent_challenge=${challenge}`);
    }
    async acceptConsent(dto) {
        var _a, _b;
        const consentReq = await this.hydra.getConsentRequest(dto.consent_challenge);
        const idTokenClaims = {};
        if (consentReq.subject) {
            try {
                const identity = await this.kratosIdentities.getIdentity(consentReq.subject);
                const traits = identity.traits;
                if (traits === null || traits === void 0 ? void 0 : traits.email)
                    idTokenClaims['email'] = traits.email;
                if (traits === null || traits === void 0 ? void 0 : traits.full_name)
                    idTokenClaims['name'] = traits.full_name;
            }
            catch (_c) {
            }
        }
        const accepted = await this.hydra.acceptConsentRequest(dto.consent_challenge, {
            grant_scope: dto.grant_scopes,
            grant_access_token_audience: (_a = consentReq.requested_access_token_audience) !== null && _a !== void 0 ? _a : [],
            remember: dto.remember,
            remember_for: (_b = dto.remember_for) !== null && _b !== void 0 ? _b : 3600,
            session: { id_token: idTokenClaims },
        });
        return { redirect_to: accepted.redirect_to };
    }
    async consentInfo(challenge) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!challenge)
            throw new common_1.BadRequestException('consent_challenge is required');
        const consentReq = await this.hydra.getConsentRequest(challenge);
        return {
            consent_challenge: challenge,
            requested_scope: (_a = consentReq.requested_scope) !== null && _a !== void 0 ? _a : [],
            client: {
                client_id: (_b = consentReq.client) === null || _b === void 0 ? void 0 : _b.client_id,
                client_name: (_d = (_c = consentReq.client) === null || _c === void 0 ? void 0 : _c.client_name) !== null && _d !== void 0 ? _d : (_e = consentReq.client) === null || _e === void 0 ? void 0 : _e.client_id,
                logo_uri: (_g = (_f = consentReq.client) === null || _f === void 0 ? void 0 : _f.logo_uri) !== null && _g !== void 0 ? _g : null,
                policy_uri: (_j = (_h = consentReq.client) === null || _h === void 0 ? void 0 : _h.policy_uri) !== null && _j !== void 0 ? _j : null,
                tos_uri: (_l = (_k = consentReq.client) === null || _k === void 0 ? void 0 : _k.tos_uri) !== null && _l !== void 0 ? _l : null,
            },
        };
    }
    async oauthLogout(challenge, res) {
        if (!challenge)
            throw new common_1.BadRequestException('logout_challenge is required');
        await this.hydra.getLogoutRequest(challenge);
        const accepted = await this.hydra.acceptLogoutRequest(challenge);
        res.clearCookie(SESSION_COOKIE);
        return res.redirect(accepted.redirect_to);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Hydra login redirect handler — skip or redirect to frontend login',
    }),
    (0, common_1.Get)('login'),
    __param(0, (0, common_1.Query)('login_challenge')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HydraOAuthController.prototype, "oauthLogin", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Accept Hydra login after successful Kratos authentication',
    }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_challenge_dto_1.LoginChallengeDto, Object]),
    __metadata("design:returntype", Promise)
], HydraOAuthController.prototype, "completeLogin", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Hydra consent redirect handler — skip or redirect to frontend consent page',
    }),
    (0, common_1.Get)('consent'),
    __param(0, (0, common_1.Query)('consent_challenge')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HydraOAuthController.prototype, "oauthConsent", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Accept consent — called by frontend after user grants scopes',
    }),
    (0, common_1.Post)('consent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [consent_accept_dto_1.ConsentAcceptDto]),
    __metadata("design:returntype", Promise)
], HydraOAuthController.prototype, "acceptConsent", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Return consent request details for the frontend consent page',
    }),
    (0, common_1.Get)('consent/info'),
    __param(0, (0, common_1.Query)('consent_challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HydraOAuthController.prototype, "consentInfo", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Hydra logout handler — revoke session and redirect',
    }),
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Query)('logout_challenge')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HydraOAuthController.prototype, "oauthLogout", null);
HydraOAuthController = __decorate([
    (0, swagger_1.ApiTags)('oauth'),
    (0, common_1.Controller)('oauth'),
    __metadata("design:paramtypes", [hydra_service_1.HydraService,
        kratos_frontend_service_1.KratosFrontendService,
        kratos_identities_service_1.KratosIdentitiesService,
        config_1.ConfigService])
], HydraOAuthController);
exports.HydraOAuthController = HydraOAuthController;
//# sourceMappingURL=hydra-oauth.controller.js.map