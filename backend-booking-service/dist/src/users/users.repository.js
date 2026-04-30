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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_service_1 = require("../database/database.service");
const schema_1 = require("../database/schema");
let UsersRepository = class UsersRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        var _a;
        const rows = await this.db.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async findByEmail(email) {
        var _a;
        const rows = await this.db.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async create(data) {
        const [user] = await this.db.db.insert(schema_1.users).values(data).returning();
        return user;
    }
    async update(id, data) {
        const [user] = await this.db.db.update(schema_1.users).set(data).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).returning();
        return user !== null && user !== void 0 ? user : null;
    }
    async findOAuthAccount(provider, providerUserId) {
        var _a;
        const rows = await this.db.db
            .select()
            .from(schema_1.oauthAccounts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oauthAccounts.provider, provider), (0, drizzle_orm_1.eq)(schema_1.oauthAccounts.providerUserId, providerUserId)))
            .limit(1);
        return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
    }
    async createOAuthAccount(data) {
        const [account] = await this.db.db.insert(schema_1.oauthAccounts).values(data).returning();
        return account;
    }
    async createUserWithOAuth(userData, oauthData) {
        return this.db.db.transaction(async (tx) => {
            const [user] = await tx.insert(schema_1.users).values(userData).returning();
            await tx.insert(schema_1.oauthAccounts).values(Object.assign(Object.assign({}, oauthData), { userId: user.id }));
            return user;
        });
    }
};
UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsersRepository);
exports.UsersRepository = UsersRepository;
//# sourceMappingURL=users.repository.js.map