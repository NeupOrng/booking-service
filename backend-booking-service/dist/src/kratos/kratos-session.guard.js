"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KratosSessionGuard = void 0;
const common_1 = require("@nestjs/common");
const kratos_client_wrapper_1 = require("@getlarge/kratos-client-wrapper");
const KRATOS_SESSION_KEY = 'kratosSession';
exports.KratosSessionGuard = (0, kratos_client_wrapper_1.OryAuthenticationGuard)({
    cookieResolver: (ctx) => {
        var _a;
        const req = ctx.switchToHttp().getRequest();
        return (_a = req.headers['cookie']) !== null && _a !== void 0 ? _a : '';
    },
    sessionTokenResolver: (ctx) => {
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers['x-session-token'];
        if (header)
            return header;
        const bearer = req.headers['authorization'];
        if (bearer === null || bearer === void 0 ? void 0 : bearer.startsWith('Bearer '))
            return bearer.slice(7);
        return '';
    },
    isValidSession: (session) => {
        return session.active === true;
    },
    postValidationHook: (ctx, session) => {
        const req = ctx.switchToHttp().getRequest();
        req[KRATOS_SESSION_KEY] = session;
    },
    unauthorizedFactory: (_ctx, error) => {
        const message = error instanceof Error ? error.message : 'Invalid or missing Kratos session';
        return new common_1.UnauthorizedException(message);
    },
});
//# sourceMappingURL=kratos-session.guard.js.map