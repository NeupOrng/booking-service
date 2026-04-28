import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// @ts-ignore: TS2883
export const users = pgTable('users', {
  id:              uuid('id').defaultRandom().primaryKey(),
  email:           varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:    varchar('password_hash', { length: 255 }),
  fullName:        varchar('full_name', { length: 200 }).notNull(),
  avatarUrl:       text('avatar_url'),
  role:            varchar('role', { length: 50 }).default('customer').notNull(),
  isActive:        boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
});

// @ts-ignore: TS2883
export const refreshTokens = pgTable('refresh_tokens', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').references(() => users.id).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// @ts-ignore: TS2883
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id:             uuid('id').defaultRandom().primaryKey(),
    userId:         uuid('user_id').references(() => users.id).notNull(),
    provider:       varchar('provider', { length: 50 }).notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    createdAt:      timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    providerUniqueIdx: uniqueIndex('provider_unique_idx').on(table.provider, table.providerUserId),
  }),
);

export type SelectUser         = typeof users.$inferSelect;
export type InsertUser         = typeof users.$inferInsert;
export type SelectOauthAccount = typeof oauthAccounts.$inferSelect;
export type InsertOauthAccount = typeof oauthAccounts.$inferInsert;
export type UserRole           = 'customer' | 'admin' | 'business_owner';
