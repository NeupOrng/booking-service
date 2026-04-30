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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const categories_repository_1 = require("./categories.repository");
let CategoriesService = class CategoriesService {
    constructor(categoriesRepository, redisService) {
        this.categoriesRepository = categoriesRepository;
        this.redisService = redisService;
        this.TTL = 3600;
    }
    async findAll() {
        try {
            const cached = await this.redisService.client.get('categories:all');
            if (cached)
                return JSON.parse(cached);
        }
        catch (_a) { }
        const rows = await this.categoriesRepository.findAll();
        try {
            await this.redisService.client.set('categories:all', JSON.stringify(rows), 'EX', this.TTL);
        }
        catch (_b) { }
        return rows;
    }
    async findById(id) {
        return this.categoriesRepository.findById(id);
    }
    async findBySlug(slug) {
        const key = `categories:slug:${slug}`;
        try {
            const cached = await this.redisService.client.get(key);
            if (cached)
                return JSON.parse(cached);
        }
        catch (_a) { }
        const row = await this.categoriesRepository.findBySlug(slug);
        if (row) {
            try {
                await this.redisService.client.set(key, JSON.stringify(row), 'EX', this.TTL);
            }
            catch (_b) { }
        }
        return row;
    }
    async create(dto) {
        var _a;
        const existing = await this.categoriesRepository.findBySlug(dto.slug);
        if (existing)
            throw new common_1.ConflictException(`Slug "${dto.slug}" is already in use`);
        const category = await this.categoriesRepository.create({
            name: dto.name,
            slug: dto.slug,
            description: dto.description,
            colorHex: dto.colorHex,
            sortOrder: (_a = dto.sortOrder) !== null && _a !== void 0 ? _a : 0,
        });
        await this.invalidateCache();
        return category;
    }
    async update(id, dto) {
        if (dto.slug) {
            const conflict = await this.categoriesRepository.findBySlug(dto.slug);
            if (conflict && conflict.id !== id) {
                throw new common_1.ConflictException(`Slug "${dto.slug}" is already in use`);
            }
        }
        const updated = await this.categoriesRepository.update(id, dto);
        if (!updated)
            throw new common_1.NotFoundException('Category not found');
        await this.invalidateCache();
        return updated;
    }
    async invalidateCache() {
        try {
            const slugKeys = await this.redisService.client.keys('categories:slug:*');
            const keysToDelete = ['categories:all', ...slugKeys];
            if (keysToDelete.length) {
                await this.redisService.client.del(...keysToDelete);
            }
        }
        catch (_a) { }
    }
};
CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [categories_repository_1.CategoriesRepository,
        redis_service_1.RedisService])
], CategoriesService);
exports.CategoriesService = CategoriesService;
//# sourceMappingURL=categories.service.js.map