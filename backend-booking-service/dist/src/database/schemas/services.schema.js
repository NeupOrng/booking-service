"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotLocks = exports.availabilityBlocks = exports.availabilityRules = exports.services = exports.businesses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
const categories_schema_1 = require("./categories.schema");
exports.businesses = (0, pg_core_1.pgTable)('businesses', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ownerId: (0, pg_core_1.uuid)('owner_id').notNull().references(() => users_schema_1.users.id, { onDelete: 'restrict' }),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    slug: (0, pg_core_1.varchar)('slug', { length: 200 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    address: (0, pg_core_1.text)('address'),
    logoUrl: (0, pg_core_1.text)('logo_url'),
    phone: (0, pg_core_1.varchar)('phone', { length: 30 }),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).notNull().default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.services = (0, pg_core_1.pgTable)('services', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    businessId: (0, pg_core_1.uuid)('business_id').notNull().references(() => exports.businesses.id, { onDelete: 'cascade' }),
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => categories_schema_1.categories.id, { onDelete: 'set null' }),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    priceCents: (0, pg_core_1.integer)('price_cents').notNull(),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes').notNull(),
    coverImageUrl: (0, pg_core_1.text)('cover_image_url'),
    cancellationPolicy: (0, pg_core_1.text)('cancellation_policy'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.availabilityRules = (0, pg_core_1.pgTable)('availability_rules', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    serviceId: (0, pg_core_1.uuid)('service_id').notNull().references(() => exports.services.id, { onDelete: 'cascade' }),
    dayOfWeek: (0, pg_core_1.varchar)('day_of_week', { length: 10 }).notNull(),
    startTime: (0, pg_core_1.varchar)('start_time', { length: 8 }).notNull(),
    endTime: (0, pg_core_1.varchar)('end_time', { length: 8 }).notNull(),
    slotDurationMinutes: (0, pg_core_1.integer)('slot_duration_minutes').notNull(),
    capacity: (0, pg_core_1.integer)('capacity').notNull().default(1),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
});
exports.availabilityBlocks = (0, pg_core_1.pgTable)('availability_blocks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    serviceId: (0, pg_core_1.uuid)('service_id').notNull().references(() => exports.services.id, { onDelete: 'cascade' }),
    blockDate: (0, pg_core_1.varchar)('block_date', { length: 10 }).notNull(),
    startTime: (0, pg_core_1.varchar)('start_time', { length: 8 }),
    endTime: (0, pg_core_1.varchar)('end_time', { length: 8 }),
    reason: (0, pg_core_1.text)('reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.slotLocks = (0, pg_core_1.pgTable)('slot_locks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    serviceId: (0, pg_core_1.uuid)('service_id').notNull().references(() => exports.services.id, { onDelete: 'cascade' }),
    slotDate: (0, pg_core_1.varchar)('slot_date', { length: 10 }).notNull(),
    slotTime: (0, pg_core_1.varchar)('slot_time', { length: 8 }).notNull(),
    lockedByUserId: (0, pg_core_1.uuid)('locked_by_user_id').references(() => users_schema_1.users.id, { onDelete: 'set null' }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=services.schema.js.map