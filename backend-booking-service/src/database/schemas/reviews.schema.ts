import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { services } from './services.schema';

// @ts-ignore: TS2883
export const reviews = pgTable(
  'reviews',
  {
    id:         uuid('id').primaryKey().defaultRandom(),
    serviceId:  uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    bookingId:  uuid('booking_id'), // soft reference — not a FK to avoid cascade complexity
    rating:     integer('rating').notNull(),       // 1–5
    comment:    text('comment'),
    createdAt:  timestamp('created_at').defaultNow().notNull(),
    updatedAt:  timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // one review per customer per service
    customerServiceUniq: uniqueIndex('reviews_customer_service_idx').on(table.customerId, table.serviceId),
  }),
);

export type InsertReview = typeof reviews.$inferInsert;
export type SelectReview = typeof reviews.$inferSelect;
