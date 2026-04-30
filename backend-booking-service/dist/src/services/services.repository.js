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
exports.ServicesRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
let ServicesRepository = class ServicesRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll(query) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 12;
        const offset = (page - 1) * perPage;
        const conditions = [];
        if (query.q) {
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.services.name, `%${query.q}%`), (0, drizzle_orm_1.ilike)(schema_1.businesses.name, `%${query.q}%`)));
        }
        if (query.categoryId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.services.categoryId, query.categoryId));
        }
        const where = (0, drizzle_orm_1.and)(...conditions);
        const orderBy = (() => {
            switch (query.sort) {
                case 'price_asc':
                    return (0, drizzle_orm_1.asc)(schema_1.services.priceCents);
                case 'price_desc':
                    return (0, drizzle_orm_1.desc)(schema_1.services.priceCents);
                case 'duration_asc':
                    return (0, drizzle_orm_1.asc)(schema_1.services.durationMinutes);
                default:
                    return (0, drizzle_orm_1.asc)(schema_1.services.createdAt);
            }
        })();
        const [countResult, rows] = await Promise.all([
            this.db.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.services)
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.services.businessId, schema_1.businesses.id))
                .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
                .where(where),
            this.db.db
                .select({
                service: schema_1.services,
                business: schema_1.businesses,
                category: schema_1.categories,
            })
                .from(schema_1.services)
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.services.businessId, schema_1.businesses.id))
                .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
                .where(where)
                .orderBy(orderBy)
                .limit(perPage)
                .offset(offset),
        ]);
        return { rows, total: Number(countResult[0].count) };
    }
    async findAllByBusinessUserId(query, userId) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 12;
        const offset = (page - 1) * perPage;
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.services.isActive, true)];
        const businessUser = await this.db.db
            .select()
            .from(schema_1.businesses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.businesses.ownerId, userId), (0, drizzle_orm_1.eq)(schema_1.businesses.status, 'active')))
            .limit(1);
        conditions.push((0, drizzle_orm_1.eq)(schema_1.services.businessId, businessUser[0].id));
        if (query.q) {
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.services.name, `%${query.q}%`), (0, drizzle_orm_1.ilike)(schema_1.businesses.name, `%${query.q}%`)));
        }
        if (query.categoryId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.services.categoryId, query.categoryId));
        }
        const where = (0, drizzle_orm_1.and)(...conditions);
        const orderBy = (() => {
            switch (query.sort) {
                case 'price_asc':
                    return (0, drizzle_orm_1.asc)(schema_1.services.priceCents);
                case 'price_desc':
                    return (0, drizzle_orm_1.desc)(schema_1.services.priceCents);
                case 'duration_asc':
                    return (0, drizzle_orm_1.asc)(schema_1.services.durationMinutes);
                default:
                    return (0, drizzle_orm_1.asc)(schema_1.services.createdAt);
            }
        })();
        const [countResult, rows] = await Promise.all([
            this.db.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.services)
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.services.businessId, schema_1.businesses.id))
                .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
                .where(where),
            this.db.db
                .select({
                service: schema_1.services,
                business: schema_1.businesses,
                category: schema_1.categories,
            })
                .from(schema_1.services)
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.services.businessId, schema_1.businesses.id))
                .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
                .where(where)
                .orderBy(orderBy)
                .limit(perPage)
                .offset(offset),
        ]);
        return { rows, total: Number(countResult[0].count) };
    }
    async findWithRelations(id) {
        var _a;
        const rows = await this.db.db
            .select({
            service: schema_1.services,
            business: schema_1.businesses,
            category: schema_1.categories,
        })
            .from(schema_1.services)
            .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.services.businessId, schema_1.businesses.id))
            .leftJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.services.categoryId, schema_1.categories.id))
            .where((0, drizzle_orm_1.eq)(schema_1.services.id, id))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findById(id) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.services)
            .where((0, drizzle_orm_1.eq)(schema_1.services.id, id))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findBusinessById(id) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.businesses)
            .where((0, drizzle_orm_1.eq)(schema_1.businesses.id, id))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findBusinessByOwnerId(ownerId) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.businesses)
            .where((0, drizzle_orm_1.eq)(schema_1.businesses.ownerId, ownerId))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findBusinessBySlug(slug) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.businesses)
            .where((0, drizzle_orm_1.eq)(schema_1.businesses.slug, slug))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async updateBusiness(id, data) {
        const [row] = await this.db.db
            .update(schema_1.businesses)
            .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
            .where((0, drizzle_orm_1.eq)(schema_1.businesses.id, id))
            .returning();
        return row !== null && row !== void 0 ? row : null;
    }
    async create(data) {
        const row = await this.db.db.transaction(async (txn) => {
            const inserted = await txn.insert(schema_1.services)
                .values(data)
                .returning();
            const result = await txn.select({
                service: schema_1.services,
                business: schema_1.businesses,
                category: schema_1.categories
            }).from(schema_1.services)
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.businesses.id, schema_1.services.businessId))
                .innerJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.categories.id, schema_1.services.categoryId))
                .where((0, drizzle_orm_1.eq)(schema_1.services.id, inserted[0].id));
            return result[0];
        });
        return row;
    }
    async update(id, data) {
        const result = await this.db.db.transaction(async (txn) => {
            const [row] = await txn
                .update(schema_1.services)
                .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
                .where((0, drizzle_orm_1.eq)(schema_1.services.id, id))
                .returning();
            const res = await this.db.db
                .select({
                service: schema_1.services,
                business: schema_1.businesses,
                category: schema_1.categories,
            })
                .from(schema_1.services)
                .innerJoin(schema_1.businesses, (0, drizzle_orm_1.eq)(schema_1.services.businessId, schema_1.businesses.id))
                .innerJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.categories.id, schema_1.services.categoryId))
                .where((0, drizzle_orm_1.eq)(schema_1.services.id, id))
                .limit(1);
            return res;
        });
        return result[0];
    }
    async findRulesByDayOfWeek(serviceId, dayOfWeek) {
        return this.db.db
            .select()
            .from(schema_1.availabilityRules)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.availabilityRules.serviceId, serviceId), (0, drizzle_orm_1.eq)(schema_1.availabilityRules.dayOfWeek, dayOfWeek), (0, drizzle_orm_1.eq)(schema_1.availabilityRules.isActive, true)));
    }
    async findBlocksByDate(serviceId, date) {
        return this.db.db
            .select()
            .from(schema_1.availabilityBlocks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.availabilityBlocks.serviceId, serviceId), (0, drizzle_orm_1.eq)(schema_1.availabilityBlocks.blockDate, date)));
    }
    async findBookedSlots(serviceId, date) {
        const rows = await this.db.db
            .select({ bookingTime: schema_1.bookings.bookingTime, count: (0, drizzle_orm_1.count)() })
            .from(schema_1.bookings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.bookings.serviceId, serviceId), (0, drizzle_orm_1.eq)(schema_1.bookings.bookingDate, date), (0, drizzle_orm_1.inArray)(schema_1.bookings.status, ['pending', 'confirmed'])))
            .groupBy(schema_1.bookings.bookingTime);
        return rows.map((r) => ({
            bookingTime: r.bookingTime,
            count: Number(r.count),
        }));
    }
    async findAllRules(serviceId) {
        return this.db.db
            .select()
            .from(schema_1.availabilityRules)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityRules.serviceId, serviceId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.availabilityRules.dayOfWeek));
    }
    async findRuleById(ruleId) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.availabilityRules)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityRules.id, ruleId))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async createRule(data) {
        const [row] = await this.db.db
            .insert(schema_1.availabilityRules)
            .values(data)
            .returning();
        return row;
    }
    async updateRule(ruleId, data) {
        const [row] = await this.db.db
            .update(schema_1.availabilityRules)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityRules.id, ruleId))
            .returning();
        return row !== null && row !== void 0 ? row : null;
    }
    async deleteRule(ruleId) {
        await this.db.db
            .delete(schema_1.availabilityRules)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityRules.id, ruleId));
    }
    async findAllBlocks(serviceId) {
        return this.db.db
            .select()
            .from(schema_1.availabilityBlocks)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityBlocks.serviceId, serviceId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.availabilityBlocks.blockDate));
    }
    async findBlockById(blockId) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.availabilityBlocks)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityBlocks.id, blockId))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async createBlock(data) {
        const [row] = await this.db.db
            .insert(schema_1.availabilityBlocks)
            .values(data)
            .returning();
        return row;
    }
    async updateBlock(blockId, data) {
        const [row] = await this.db.db
            .update(schema_1.availabilityBlocks)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityBlocks.id, blockId))
            .returning();
        return row !== null && row !== void 0 ? row : null;
    }
    async deleteBlock(blockId) {
        await this.db.db
            .delete(schema_1.availabilityBlocks)
            .where((0, drizzle_orm_1.eq)(schema_1.availabilityBlocks.id, blockId));
    }
};
ServicesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ServicesRepository);
exports.ServicesRepository = ServicesRepository;
//# sourceMappingURL=services.repository.js.map