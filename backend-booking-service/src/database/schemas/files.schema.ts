import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// @ts-ignore: TS2883 — nullable FK (uploadedBy) with onDelete triggers CJS type-portability false positive under declaration:true
export const files = pgTable('files', {
  id:           uuid('id').primaryKey().defaultRandom(),
  bucket:       varchar('bucket', { length: 100 }).notNull(),
  objectKey:    varchar('object_key', { length: 500 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType:     varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes:    integer('size_bytes').notNull(),
  uploadedBy:   uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export type InsertFile = typeof files.$inferInsert;
export type SelectFile = typeof files.$inferSelect;
