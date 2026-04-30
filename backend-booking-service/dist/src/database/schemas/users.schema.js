"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthAccounts = exports.refreshTokens = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 200 }).notNull(),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    role: (0, pg_core_1.varchar)('role', { length: 50 }).default('customer').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    isEmailVerified: (0, pg_core_1.boolean)('is_email_verified').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    tokenHash: (0, pg_core_1.varchar)('token_hash', { length: 255 }).notNull(),
    isRevoked: (0, pg_core_1.boolean)('is_revoked').default(false).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.oauthAccounts = (0, pg_core_1.pgTable)('oauth_accounts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 50 }).notNull(),
    providerUserId: (0, pg_core_1.varchar)('provider_user_id', { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    providerUniqueIdx: (0, pg_core_1.uniqueIndex)('provider_unique_idx').on(table.provider, table.providerUserId),
}));
//# sourceMappingURL=users.schema.js.map