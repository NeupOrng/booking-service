import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { categories } from './categories.schema';

// @ts-ignore: TS2883
export const businesses = pgTable('businesses', {
  id:          uuid('id').primaryKey().defaultRandom(),
  ownerId:     uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  name:        varchar('name', { length: 200 }).notNull(),
  slug:        varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description'),
  address:     text('address'),
  logoUrl:     text('logo_url'),
  phone:       varchar('phone', { length: 30 }),
  status:      varchar('status', { length: 30 }).notNull().default('active'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});

export type InsertBusiness = typeof businesses.$inferInsert;
export type SelectBusiness = typeof businesses.$inferSelect;

// @ts-ignore: TS2883 — nullable FK (categoryId) with onDelete
export const services = pgTable('services', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  businessId:         uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  categoryId:         uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name:               varchar('name', { length: 200 }).notNull(),
  description:        text('description'),
  priceCents:         integer('price_cents').notNull(),
  durationMinutes:    integer('duration_minutes').notNull(),
  coverImageUrl:      text('cover_image_url'),
  cancellationPolicy: text('cancellation_policy'),
  isActive:           boolean('is_active').notNull().default(true),
  createdAt:          timestamp('created_at').defaultNow().notNull(),
  updatedAt:          timestamp('updated_at').defaultNow().notNull(),
});

export type InsertService = typeof services.$inferInsert;
export type SelectService = typeof services.$inferSelect;

// @ts-ignore: TS2883
export const availabilityRules = pgTable('availability_rules', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  serviceId:           uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  dayOfWeek:           varchar('day_of_week', { length: 10 }).notNull(),
  startTime:           varchar('start_time', { length: 8 }).notNull(),
  endTime:             varchar('end_time', { length: 8 }).notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull(),
  capacity:            integer('capacity').notNull().default(1),
  isActive:            boolean('is_active').notNull().default(true),
});

export type InsertAvailabilityRule = typeof availabilityRules.$inferInsert;
export type SelectAvailabilityRule = typeof availabilityRules.$inferSelect;

// @ts-ignore: TS2883
export const availabilityBlocks = pgTable('availability_blocks', {
  id:        uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  blockDate: varchar('block_date', { length: 10 }).notNull(),
  startTime: varchar('start_time', { length: 8 }),
  endTime:   varchar('end_time', { length: 8 }),
  reason:    text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type InsertAvailabilityBlock = typeof availabilityBlocks.$inferInsert;
export type SelectAvailabilityBlock = typeof availabilityBlocks.$inferSelect;

// @ts-ignore: TS2883 — nullable FK (lockedByUserId) with onDelete
export const slotLocks = pgTable('slot_locks', {
  id:             uuid('id').primaryKey().defaultRandom(),
  serviceId:      uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  slotDate:       varchar('slot_date', { length: 10 }).notNull(),
  slotTime:       varchar('slot_time', { length: 8 }).notNull(),
  lockedByUserId: uuid('locked_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt:      timestamp('expires_at').notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

export type InsertSlotLock = typeof slotLocks.$inferInsert;
export type SelectSlotLock = typeof slotLocks.$inferSelect;
