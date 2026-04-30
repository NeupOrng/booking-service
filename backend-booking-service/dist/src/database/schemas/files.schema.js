"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.files = (0, pg_core_1.pgTable)('files', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    bucket: (0, pg_core_1.varchar)('bucket', { length: 100 }).notNull(),
    objectKey: (0, pg_core_1.varchar)('object_key', { length: 500 }).notNull(),
    originalName: (0, pg_core_1.varchar)('original_name', { length: 255 }).notNull(),
    mimeType: (0, pg_core_1.varchar)('mime_type', { length: 100 }).notNull(),
    sizeBytes: (0, pg_core_1.integer)('size_bytes').notNull(),
    uploadedBy: (0, pg_core_1.uuid)('uploaded_by').references(() => users_schema_1.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=files.schema.js.map