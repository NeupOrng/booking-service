"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookings = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
const services_schema_1 = require("./services.schema");
exports.bookings = (0, pg_core_1.pgTable)('bookings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    serviceId: (0, pg_core_1.uuid)('service_id').notNull().references(() => services_schema_1.services.id, { onDelete: 'restrict' }),
    customerId: (0, pg_core_1.uuid)('customer_id').notNull().references(() => users_schema_1.users.id, { onDelete: 'restrict' }),
    businessId: (0, pg_core_1.uuid)('business_id').notNull().references(() => services_schema_1.businesses.id, { onDelete: 'restrict' }),
    reference: (0, pg_core_1.varchar)('reference', { length: 20 }).notNull(),
    bookingDate: (0, pg_core_1.varchar)('booking_date', { length: 10 }).notNull(),
    bookingTime: (0, pg_core_1.varchar)('booking_time', { length: 8 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 30 }).notNull().default('pending'),
    priceCents: (0, pg_core_1.integer)('price_cents').notNull(),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes').notNull(),
    cancelledBy: (0, pg_core_1.varchar)('cancelled_by', { length: 30 }),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at'),
    refundStatus: (0, pg_core_1.varchar)('refund_status', { length: 20 }),
    refundAmount: (0, pg_core_1.integer)('refund_amount'),
    notesFromCustomer: (0, pg_core_1.text)('notes_from_customer'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
});
//# sourceMappingURL=bookings.schema.js.map