"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    var _a, _b;
    return ({
        jwt: {
            privateKey: (_a = process.env.JWT_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
            publicKey: (_b = process.env.JWT_PUBLIC_KEY) === null || _b === void 0 ? void 0 : _b.replace(/\\n/g, '\n'),
            accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        },
        oauth: {
            google: {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
            },
        },
        storage: {
            url: process.env.SUPABASE_URL,
            serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            bucket: process.env.SUPABASE_BUCKET || 'booking-uploads',
            presignExpirySeconds: parseInt(process.env.SUPABASE_PRESIGN_EXPIRY_SECONDS || '3600', 10),
        },
    });
};
//# sourceMappingURL=configuration.js.map