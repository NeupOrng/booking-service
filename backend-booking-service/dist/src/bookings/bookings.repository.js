"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
const BOOKED_STATUSES = ['pending', 'confirmed'];
function bookingJoinSelect() {
    return {
        booking: schema_1.bookings,
        service: {
            id: schema_1.services.id,
            name: schema_1.services.name,
            coverImageUrl: schema_1.services.coverImageUrl,
            durationMinutes: schema_1.services.durationMinutes,
        },
        category: { slug: schema_1.categories.slug },
        business: {
            id: schema_1.businesses.id,
            name: schema_1.businesses.name,
            logo: schema_1.businesses.logoUrl,
        },
        customer: {
            id: schema_1.users.id,
            fullName: schema_1.users.fullName,
            email: schema_1.users.email,
            avatarUrl: schema_1.users.avatarUrl,
        },
    };
}
let BookingsRepository = class BookingsRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        const [row] = await this.db.db
            .insert(schema_1.bookings)
            .values(data)
            .returning();
        return row;
    }
    async writeSlotLockAudit(serviceId, slotDate, slotTime, userId, bookingId) {
        const [datePart] = slotDate.split('T');
        const [h, m] = slotTime.split(':').map(Number);
        const expiresAt = new Date(datePart);
        expiresAt.setHours(h, m, 0, 0);
        await this.db.db.insert(schema_1.slotLocks).values({
            serviceId,
            slotDate,
            slotTime,
            lockedByUserId: userId,
            expiresAt,
        });
        void bookingId;
    }
    async findById(id) {
        var _a;
        const rows = await this.db.db
            .select(bookingJoinSelect())
            .from(schema_1.bookings)
            .innerJoin(schema_1.services, (0, drizzle_orm_1.eq)(schema_1.bookings.serviceId, schema_1.services.id))
            .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
            .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.bookings.businessId, schema_1.businesses.id))
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.bookings.customerId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.bookings.id, id))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async update(id, data) {
        const [row] = await this.db.db
            .update(schema_1.bookings)
            .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.bookings.id, id))
            .returning();
        return row !== null && row !== void 0 ? row : null;
    }
    async findByCustomer(customerId, query) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 10;
        const offset = (page - 1) * perPage;
        const today = new Date().toISOString().substring(0, 10);
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.bookings.customerId, customerId)];
        if (query.status === 'upcoming') {
            conditions.push((0, drizzle_orm_1.inArray)(schema_1.bookings.status, ['pending', 'confirmed']));
            conditions.push((0, drizzle_orm_1.gte)(schema_1.bookings.bookingDate, today));
        }
        else if (query.status === 'past') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.bookings.status, 'completed'));
        }
        else if (query.status === 'cancelled') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.bookings.status, 'cancelled'));
        }
        const where = (0, drizzle_orm_1.and)(...conditions);
        const [countResult, rows] = await Promise.all([
            this.db.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.bookings).where(where),
            this.db.db
                .select(bookingJoinSelect())
                .from(schema_1.bookings)
                .innerJoin(schema_1.services, (0, drizzle_orm_1.eq)(schema_1.bookings.serviceId, schema_1.services.id))
                .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.bookings.businessId, schema_1.businesses.id))
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.bookings.customerId, schema_1.users.id))
                .where(where)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.bookings.bookingDate))
                .limit(perPage)
                .offset(offset),
        ]);
        return { rows, total: Number(countResult[0].count) };
    }
    async customerStats(customerId) {
        const today = new Date().toISOString().substring(0, 10);
        const [upcomingResult, completedResult, spentResult] = await Promise.all([
            this.db.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.bookings)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.bookings.customerId, customerId), (0, drizzle_orm_1.inArray)(schema_1.bookings.status, ['pending', 'confirmed']), (0, drizzle_orm_1.gte)(schema_1.bookings.bookingDate, today))),
            this.db.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.bookings)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.bookings.customerId, customerId), (0, drizzle_orm_1.eq)(schema_1.bookings.status, 'completed'))),
            this.db.db
                .select({
                total: (0, drizzle_orm_1.sql) `COALESCE(SUM(${schema_1.bookings.priceCents}), 0)`,
            })
                .from(schema_1.bookings)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.bookings.customerId, customerId), (0, drizzle_orm_1.inArray)(schema_1.bookings.status, [
                'confirmed',
                'completed',
            ]))),
        ]);
        return {
            upcoming: Number(upcomingResult[0].count),
            completed: Number(completedResult[0].count),
            totalSpent: Number(spentResult[0].total),
        };
    }
    async findByBusiness(businessId, query) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 10;
        const offset = (page - 1) * perPage;
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.bookings.businessId, businessId)];
        if (query.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.bookings.status, query.status));
        if (query.dateFrom)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.bookings.bookingDate, query.dateFrom));
        if (query.dateTo)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.bookings.bookingDate, query.dateTo));
        const where = (0, drizzle_orm_1.and)(...conditions);
        const [countResult, rows] = await Promise.all([
            this.db.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.bookings).where(where),
            this.db.db
                .select(bookingJoinSelect())
                .from(schema_1.bookings)
                .innerJoin(schema_1.services, (0, drizzle_orm_1.eq)(schema_1.bookings.serviceId, schema_1.services.id))
                .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.bookings.businessId, schema_1.businesses.id))
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.bookings.customerId, schema_1.users.id))
                .where(where)
                .orderBy((0, drizzle_orm_1.asc)(schema_1.bookings.bookingDate), (0, drizzle_orm_1.asc)(schema_1.bookings.bookingTime))
                .limit(perPage)
                .offset(offset),
        ]);
        return { rows, total: Number(countResult[0].count) };
    }
};
BookingsRepository.bookedStatusValues = BOOKED_STATUSES;
BookingsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BookingsRepository);
exports.BookingsRepository = BookingsRepository;
//# sourceMappingURL=bookings.repository.js.map