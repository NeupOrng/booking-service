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
exports.ReviewsRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
let ReviewsRepository = class ReviewsRepository {
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        const [row] = await this.db.db.insert(schema_1.reviews).values(data).returning();
        return row;
    }
    async findById(id) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.reviews)
            .where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findByCustomerAndService(customerId, serviceId) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.reviews)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.reviews.customerId, customerId), (0, drizzle_orm_1.eq)(schema_1.reviews.serviceId, serviceId)))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async checkHasCompletedBooking(customerId, serviceId) {
        const rows = await this.db.db
            .select({ id: schema_1.bookings.id })
            .from(schema_1.bookings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.bookings.customerId, customerId), (0, drizzle_orm_1.eq)(schema_1.bookings.serviceId, serviceId), (0, drizzle_orm_1.eq)(schema_1.bookings.status, 'completed')))
            .limit(1);
        return rows.length > 0;
    }
    async findByService(serviceId, query) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 10;
        const offset = (page - 1) * perPage;
        const where = (0, drizzle_orm_1.eq)(schema_1.reviews.serviceId, serviceId);
        const [countResult, rows] = await Promise.all([
            this.db.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.reviews).where(where),
            this.db.db
                .select({
                review: schema_1.reviews,
                reviewer: {
                    id: schema_1.users.id,
                    fullName: schema_1.users.fullName,
                },
            })
                .from(schema_1.reviews)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.reviews.customerId, schema_1.users.id))
                .where(where)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.reviews.createdAt))
                .limit(perPage)
                .offset(offset),
        ]);
        return { rows, total: Number(countResult[0].count) };
    }
    async getStats(serviceId) {
        const [result] = await this.db.db
            .select({
            avgRating: (0, drizzle_orm_1.avg)(schema_1.reviews.rating),
            reviewCount: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.reviews)
            .where((0, drizzle_orm_1.eq)(schema_1.reviews.serviceId, serviceId));
        return {
            avgRating: result.avgRating ? parseFloat(result.avgRating) : null,
            reviewCount: Number(result.reviewCount),
        };
    }
    async delete(id) {
        await this.db.db.delete(schema_1.reviews).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id));
    }
};
ReviewsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ReviewsRepository);
exports.ReviewsRepository = ReviewsRepository;
//# sourceMappingURL=reviews.repository.js.map