import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// @ts-ignore: TS2883
export const categories = pgTable('categories', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  colorHex:    varchar('color_hex', { length: 7 }),
  sortOrder:   integer('sort_order').notNull().default(0),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export type InsertCategory = typeof categories.$inferInsert;
export type SelectCategory = typeof categories.$inferSelect;
