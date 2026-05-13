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
exports.KratosAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kratos_client_wrapper_1 = require("@getlarge/kratos-client-wrapper");
const kratos_frontend_service_1 = require("./kratos-frontend.service");
const SESSION_COOKIE = 'ory_kratos_session';
const IS_PROD = process.env.NODE_ENV === 'production';
function setSessionCookie(res, token, expiresAt) {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'strict' : 'lax',
        expires: expiresAt ? new Date(expiresAt) : undefined,
    });
}
function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE);
}
function toHttpException(error) {
    var _a, _b, _c, _d, _e;
    if ((0, kratos_client_wrapper_1.isOryError)(error)) {
        const status = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 500;
        const data = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : { message: (_e = error.message) !== null && _e !== void 0 ? _e : 'Kratos error' };
        return new common_1.HttpException(data, status);
    }
    if (error instanceof Error) {
        return new common_1.InternalServerErrorException(error.message);
    }
    return new common_1.InternalServerErrorException();
}
function resolveToken(req) {
    var _a;
    if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE])
        return req.cookies[SESSION_COOKIE];
    const header = req.headers['x-session-token'];
    if (header)
        return header;
    const bearer = req.headers['authorization'];
    if (bearer === null || bearer === void 0 ? void 0 : bearer.startsWith('Bearer '))
        return bearer.slice(7);
    return undefined;
}
let KratosAuthController = class KratosAuthController {
    constructor(kratosFrontend) {
        this.kratosFrontend = kratosFrontend;
    }
    async initLoginFlow() {
        try {
            const response = await this.kratosFrontend.createLoginFlow();
            return response.data;
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async getLoginFlow(id) {
        try {
            const response = await this.kratosFrontend.getLoginFlow(id);
            return response.data;
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async submitLoginFlow(flowId, body, req, res) {
        try {
            const response = await this.kratosFrontend.submitLoginFlow(flowId, body, resolveToken(req));
            const { session_token, session, identity } = response.data;
            if (session_token) {
                setSessionCookie(res, session_token, session === null || session === void 0 ? void 0 : session.expires_at);
            }
            return { session, identity };
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async initRegistrationFlow() {
        try {
            const response = await this.kratosFrontend.createRegistrationFlow();
            return response.data;
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async getRegistrationFlow(id) {
        try {
            const response = await this.kratosFrontend.getRegistrationFlow(id);
            return response.data;
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async submitRegistrationFlow(flowId, body, res) {
        try {
            const response = await this.kratosFrontend.submitRegistrationFlow(flowId, body);
            const { session_token, session, identity } = response.data;
            if (session_token) {
                setSessionCookie(res, session_token, session === null || session === void 0 ? void 0 : session.expires_at);
            }
            return { session, identity };
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async whoami(req) {
        try {
            const response = await this.kratosFrontend.getSession(resolveToken(req));
            return response.data;
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
    async logout(req, res) {
        const token = resolveToken(req);
        if (!token)
            throw new common_1.HttpException({ message: 'No active session' }, 400);
        try {
            await this.kratosFrontend.logout(token);
            clearSessionCookie(res);
            return { message: 'Logged out' };
        }
        catch (e) {
            throw toHttpException(e);
        }
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Initialize a native login flow' }),
    (0, common_1.Get)('login/flow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "initLoginFlow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get login flow by ID' }),
    (0, common_1.Get)('login/flows'),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "getLoginFlow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Submit a login flow' }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Query)('flow')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "submitLoginFlow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Initialize a native registration flow' }),
    (0, common_1.Get)('registration/flow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "initRegistrationFlow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get registration flow by ID' }),
    (0, common_1.Get)('registration/flows'),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "getRegistrationFlow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Submit a registration flow' }),
    (0, common_1.Post)('registration'),
    __param(0, (0, common_1.Query)('flow')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "submitRegistrationFlow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Return the current session (whoami)' }),
    (0, common_1.Get)('sessions/whoami'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "whoami", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Invalidate the current session' }),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KratosAuthController.prototype, "logout", null);
KratosAuthController = __decorate([
    (0, swagger_1.ApiTags)('auth/kratos'),
    (0, common_1.Controller)('auth/kratos'),
    __metadata("design:paramtypes", [kratos_frontend_service_1.KratosFrontendService])
], KratosAuthController);
exports.KratosAuthController = KratosAuthController;
//# sourceMappingURL=kratos-auth.controller.js.map