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
exports.FilesRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
let FilesRepository = class FilesRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        var _a;
        const rows = await this.db.db.select().from(schema_1.files).where((0, drizzle_orm_1.eq)(schema_1.files.id, id)).limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findByIds(ids) {
        if (ids.length === 0)
            return [];
        return this.db.db.select().from(schema_1.files).where((0, drizzle_orm_1.inArray)(schema_1.files.id, ids));
    }
    async create(data) {
        const [file] = await this.db.db.insert(schema_1.files).values(data).returning();
        return file;
    }
    async delete(id) {
        await this.db.db.delete(schema_1.files).where((0, drizzle_orm_1.eq)(schema_1.files.id, id));
    }
};
FilesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], FilesRepository);
exports.FilesRepository = FilesRepository;
//# sourceMappingURL=files.repository.js.map