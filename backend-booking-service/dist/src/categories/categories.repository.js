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
exports.CategoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
let CategoriesRepository = class CategoriesRepository {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        return this.db.db.select().from(schema_1.categories).orderBy((0, drizzle_orm_1.asc)(schema_1.categories.sortOrder));
    }
    async findById(id) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.categories)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findBySlug(slug) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.categories)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.slug, slug))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async create(data) {
        const [row] = await this.db.db.insert(schema_1.categories).values(data).returning();
        return row;
    }
    async update(id, data) {
        const [row] = await this.db.db
            .update(schema_1.categories)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id))
            .returning();
        return row !== null && row !== void 0 ? row : null;
    }
};
CategoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CategoriesRepository);
exports.CategoriesRepository = CategoriesRepository;
//# sourceMappingURL=categories.repository.js.map