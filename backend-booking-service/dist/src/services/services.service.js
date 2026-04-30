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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const categories_service_1 = require("../categories/categories.service");
const availability_service_1 = require("./availability.service");
const services_repository_1 = require("./services.repository");
function getDayOfWeek(date) {
    return new Date(date)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
}
function parseTimeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
let ServicesService = class ServicesService {
    constructor(servicesRepository, availabilityService, categoriesService, redisService) {
        this.servicesRepository = servicesRepository;
        this.availabilityService = availabilityService;
        this.categoriesService = categoriesService;
        this.redisService = redisService;
    }
    async findAll(query) {
        const result = await this.servicesRepository.findAll(query);
        return this.formatServiceResponse(result, query);
    }
    async findAllByBusinessUser(query, userId) {
        const result = await this.servicesRepository.findAllByBusinessUserId(query, userId);
        return this.formatServiceResponse(result, query);
    }
    async findById(id) {
        const row = await this.servicesRepository.findWithRelations(id);
        if (!row || !row.service.isActive)
            return null;
        return row;
    }
    async getAvailability(serviceId, date) {
        const row = await this.servicesRepository.findWithRelations(serviceId);
        if (!row || !row.service.isActive)
            throw new common_1.NotFoundException('Service not found');
        const dayOfWeek = getDayOfWeek(date);
        const [rules, blocks, bookedCounts] = await Promise.all([
            this.servicesRepository.findRulesByDayOfWeek(serviceId, dayOfWeek),
            this.servicesRepository.findBlocksByDate(serviceId, date),
            this.servicesRepository.findBookedSlots(serviceId, date),
        ]);
        const slots = this.availabilityService.computeSlots(rules, blocks, bookedCounts);
        return Promise.all(slots.map(async (slot) => {
            try {
                const lockKeys = await this.redisService.client.keys(`slot_lock:${serviceId}:${date}:${slot.time}:*`);
                const lockCount = lockKeys.length;
                const remaining = Math.max(0, slot.remainingCapacity - lockCount);
                return Object.assign(Object.assign({}, slot), { remainingCapacity: remaining, available: remaining > 0 });
            }
            catch (_a) {
                return Object.assign(Object.assign({}, slot), { available: slot.remainingCapacity > 0 });
            }
        }));
    }
    async getNextAvailableSlot(serviceId) {
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const date = d.toISOString().substring(0, 10);
            const slots = await this.getAvailability(serviceId, date).catch(() => []);
            const first = slots.find((s) => s.available);
            if (first)
                return `${date}T${first.time}:00.000Z`;
        }
        return null;
    }
    async findBusinessByOwner(ownerId) {
        return this.servicesRepository.findBusinessByOwnerId(ownerId);
    }
    async updateBusiness(id, dto, userId, userRole) {
        const business = await this.servicesRepository.findBusinessById(id);
        if (!business)
            throw new common_1.NotFoundException('Business not found');
        if (userRole !== 'admin' && business.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this business');
        }
        if (dto.slug && dto.slug !== business.slug) {
            const conflict = await this.servicesRepository.findBusinessBySlug(dto.slug);
            if (conflict)
                throw new common_1.ConflictException('Business slug already in use');
        }
        const updated = await this.servicesRepository.updateBusiness(id, dto);
        if (!updated)
            throw new common_1.NotFoundException('Business not found');
        return updated;
    }
    async createService(dto, userId, userRole) {
        var _a, _b;
        if (userRole !== 'admin') {
            const business = await this.servicesRepository.findBusinessById(dto.businessId);
            if (!business)
                throw new common_1.NotFoundException('Business not found');
            if (business.ownerId !== userId)
                throw new common_1.ForbiddenException('You do not own this business');
        }
        if (dto.categoryId) {
            const category = await this.categoriesService.findById(dto.categoryId);
            if (!category)
                throw new common_1.NotFoundException('Category not found');
        }
        return this.servicesRepository.create({
            businessId: dto.businessId,
            categoryId: (_a = dto.categoryId) !== null && _a !== void 0 ? _a : null,
            name: dto.name,
            description: dto.description,
            priceCents: dto.priceCents,
            durationMinutes: dto.durationMinutes,
            coverImageUrl: dto.coverImageUrl,
            cancellationPolicy: dto.cancellationPolicy,
            isActive: (_b = dto.isActive) !== null && _b !== void 0 ? _b : true,
        });
    }
    async updateService(id, dto, userId, userRole) {
        await this.assertServiceOwnership(id, userId, userRole);
        if (dto.categoryId) {
            const category = await this.categoriesService.findById(dto.categoryId);
            if (!category)
                throw new common_1.NotFoundException('Category not found');
        }
        const updated = await this.servicesRepository.update(id, dto);
        if (!updated)
            throw new common_1.NotFoundException('Service not found');
        return updated;
    }
    async assertServiceOwnership(serviceId, userId, userRole) {
        const service = await this.servicesRepository.findById(serviceId);
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        if (userRole === 'admin')
            return;
        const business = await this.servicesRepository.findBusinessById(service.businessId);
        if (!business || business.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this service');
        }
    }
    async listRules(serviceId, userId, userRole) {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        return this.servicesRepository.findAllRules(serviceId);
    }
    async createRule(serviceId, dto, userId, userRole) {
        var _a, _b;
        await this.assertServiceOwnership(serviceId, userId, userRole);
        const startMinutes = parseTimeToMinutes(dto.startTime);
        const endMinutes = parseTimeToMinutes(dto.endTime);
        if (startMinutes >= endMinutes) {
            throw new common_1.BadRequestException('startTime must be before endTime');
        }
        const windowMinutes = endMinutes - startMinutes;
        if (windowMinutes % dto.slotDurationMinutes !== 0) {
            throw new common_1.BadRequestException(`${dto.slotDurationMinutes}-min slots do not divide evenly into a ${windowMinutes}-min window`);
        }
        return this.servicesRepository.createRule({
            serviceId,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            slotDurationMinutes: dto.slotDurationMinutes,
            capacity: (_a = dto.capacity) !== null && _a !== void 0 ? _a : 1,
            isActive: (_b = dto.isActive) !== null && _b !== void 0 ? _b : true,
        });
    }
    async updateRule(serviceId, ruleId, dto, userId, userRole) {
        var _a, _b, _c;
        await this.assertServiceOwnership(serviceId, userId, userRole);
        const existing = await this.servicesRepository.findRuleById(ruleId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new common_1.NotFoundException('Availability rule not found');
        }
        if (dto.startTime || dto.endTime || dto.slotDurationMinutes) {
            const startTime = (_a = dto.startTime) !== null && _a !== void 0 ? _a : existing.startTime;
            const endTime = (_b = dto.endTime) !== null && _b !== void 0 ? _b : existing.endTime;
            const slotDurationMinutes = (_c = dto.slotDurationMinutes) !== null && _c !== void 0 ? _c : existing.slotDurationMinutes;
            const startMinutes = parseTimeToMinutes(startTime);
            const endMinutes = parseTimeToMinutes(endTime);
            if (startMinutes >= endMinutes) {
                throw new common_1.BadRequestException('startTime must be before endTime');
            }
            const windowMinutes = endMinutes - startMinutes;
            if (windowMinutes % slotDurationMinutes !== 0) {
                throw new common_1.BadRequestException(`${slotDurationMinutes}-min slots do not divide evenly into a ${windowMinutes}-min window`);
            }
        }
        return this.servicesRepository.updateRule(ruleId, dto);
    }
    async deleteRule(serviceId, ruleId, userId, userRole) {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        const existing = await this.servicesRepository.findRuleById(ruleId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new common_1.NotFoundException('Availability rule not found');
        }
        await this.servicesRepository.deleteRule(ruleId);
    }
    async listBlocks(serviceId, userId, userRole) {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        return this.servicesRepository.findAllBlocks(serviceId);
    }
    async createBlock(serviceId, dto, userId, userRole) {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        if ((dto.startTime && !dto.endTime) ||
            (!dto.startTime && dto.endTime)) {
            throw new common_1.BadRequestException('Provide both startTime and endTime, or neither for a whole-day block');
        }
        if (dto.startTime && dto.endTime) {
            if (parseTimeToMinutes(dto.startTime) >=
                parseTimeToMinutes(dto.endTime)) {
                throw new common_1.BadRequestException('startTime must be before endTime');
            }
        }
        return this.servicesRepository.createBlock({
            serviceId,
            blockDate: dto.blockDate,
            startTime: dto.startTime,
            endTime: dto.endTime,
            reason: dto.reason,
        });
    }
    async updateBlock(serviceId, blockId, dto, userId, userRole) {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        const existing = await this.servicesRepository.findBlockById(blockId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new common_1.NotFoundException('Availability block not found');
        }
        return this.servicesRepository.updateBlock(blockId, dto);
    }
    async deleteBlock(serviceId, blockId, userId, userRole) {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        const existing = await this.servicesRepository.findBlockById(blockId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new common_1.NotFoundException('Availability block not found');
        }
        await this.servicesRepository.deleteBlock(blockId);
    }
    async formatServiceResponse(result, query) {
        var _a, _b;
        const { rows, total } = result;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 12;
        let data;
        if (query.sort === 'soonest') {
            data = await Promise.all(rows.map(async (row) => ({
                service: row.service,
                business: row.business,
                category: row.category,
                nextAvailableSlot: await this.getNextAvailableSlot(row.service.id),
            })));
            data.sort((a, b) => {
                if (!a.nextAvailableSlot && !b.nextAvailableSlot)
                    return 0;
                if (!a.nextAvailableSlot)
                    return 1;
                if (!b.nextAvailableSlot)
                    return -1;
                return (new Date(a.nextAvailableSlot).getTime() -
                    new Date(b.nextAvailableSlot).getTime());
            });
        }
        else {
            data = rows.map((row) => ({
                service: row.service,
                business: row.business,
                category: row.category,
                nextAvailableSlot: null
            }));
        }
        return {
            data,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }
};
ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [services_repository_1.ServicesRepository,
        availability_service_1.AvailabilityService,
        categories_service_1.CategoriesService,
        redis_service_1.RedisService])
], ServicesService);
exports.ServicesService = ServicesService;
//# sourceMappingURL=services.service.js.map