// FILE: src/database/schemas/bookings.schema.ts
import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { businesses, services } from './services.schema';

// @ts-ignore: TS2883
export const bookings = pgTable('bookings', {
  id:               uuid('id').primaryKey().defaultRandom(),
  serviceId:        uuid('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
  customerId:       uuid('customer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  businessId:       uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'restrict' }),
  reference:        varchar('reference', { length: 20 }).notNull(),
  bookingDate:      varchar('booking_date', { length: 10 }).notNull(),   // 'YYYY-MM-DD'
  bookingTime:      varchar('booking_time', { length: 8 }).notNull(),    // 'HH:mm'
  status:           varchar('status', { length: 30 }).notNull().default('pending'),
  priceCents:       integer('price_cents').notNull(),
  durationMinutes:  integer('duration_minutes').notNull(),
  cancelledBy:      varchar('cancelled_by', { length: 30 }),             // 'customer' | 'business' | 'admin'
  cancelledAt:      timestamp('cancelled_at'),
  refundStatus:     varchar('refund_status', { length: 20 }),            // 'refunded' | 'partial' | 'none'
  refundAmount:     integer('refund_amount'),
  notesFromCustomer: text('notes_from_customer'),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
  updatedAt:        timestamp('updated_at').defaultNow().notNull(),
  completedAt:      timestamp('completed_at'),
});

export type InsertBooking = typeof bookings.$inferInsert;
export type SelectBooking = typeof bookings.$inferSelect;
