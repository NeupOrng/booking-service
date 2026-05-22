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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HydraService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@ory/client");
let HydraService = class HydraService {
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        this.admin = new client_1.OAuth2Api(new client_1.Configuration({ basePath: this.config.get('hydra.adminUrl') }));
    }
    async getLoginRequest(loginChallenge) {
        try {
            const { data } = await this.admin.getOAuth2LoginRequest({ loginChallenge });
            return data;
        }
        catch (e) {
            this.handleError(e, 'Login challenge');
        }
    }
    async acceptLoginRequest(loginChallenge, body) {
        const { data } = await this.admin.acceptOAuth2LoginRequest({
            loginChallenge,
            acceptOAuth2LoginRequest: body,
        });
        return data;
    }
    async rejectLoginRequest(loginChallenge, error = 'access_denied', description = 'The user denied the login request') {
        const { data } = await this.admin.rejectOAuth2LoginRequest({
            loginChallenge,
            rejectOAuth2Request: { error, error_description: description },
        });
        return data;
    }
    async getConsentRequest(consentChallenge) {
        try {
            const { data } = await this.admin.getOAuth2ConsentRequest({ consentChallenge });
            return data;
        }
        catch (e) {
            this.handleError(e, 'Consent challenge');
        }
    }
    async acceptConsentRequest(consentChallenge, body) {
        const { data } = await this.admin.acceptOAuth2ConsentRequest({
            consentChallenge,
            acceptOAuth2ConsentRequest: body,
        });
        return data;
    }
    async rejectConsentRequest(consentChallenge, error = 'access_denied', description = 'The user denied the consent request') {
        const { data } = await this.admin.rejectOAuth2ConsentRequest({
            consentChallenge,
            rejectOAuth2Request: { error, error_description: description },
        });
        return data;
    }
    async getLogoutRequest(logoutChallenge) {
        try {
            const { data } = await this.admin.getOAuth2LogoutRequest({ logoutChallenge });
            return data;
        }
        catch (e) {
            this.handleError(e, 'Logout challenge');
        }
    }
    async acceptLogoutRequest(logoutChallenge) {
        const { data } = await this.admin.acceptOAuth2LogoutRequest({ logoutChallenge });
        return data;
    }
    async rejectLogoutRequest(logoutChallenge) {
        await this.admin.rejectOAuth2LogoutRequest({ logoutChallenge });
    }
    handleError(error, label) {
        var _a;
        const status = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status;
        if (status === 404 || status === 410) {
            throw new common_1.BadRequestException(`${label} is invalid or has expired`);
        }
        throw error;
    }
};
HydraService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HydraService);
exports.HydraService = HydraService;
//# sourceMappingURL=hydra.service.js.map