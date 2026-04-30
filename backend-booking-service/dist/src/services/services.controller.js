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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const optional_auth_guard_1 = require("../common/guards/optional-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const services_service_1 = require("./services.service");
const service_list_query_dto_1 = require("./dto/service-list-query.dto");
const create_service_dto_1 = require("./dto/create-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const create_availability_rule_dto_1 = require("./dto/create-availability-rule.dto");
const update_availability_rule_dto_1 = require("./dto/update-availability-rule.dto");
const create_availability_block_dto_1 = require("./dto/create-availability-block.dto");
const update_availability_block_dto_1 = require("./dto/update-availability-block.dto");
class AvailabilityQueryDto {
}
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AvailabilityQueryDto.prototype, "date", void 0);
function toBusinessSummary(business) {
    return { id: business.id, name: business.name, logoUrl: business.logoUrl };
}
function toBusinessDetail(business) {
    return {
        id: business.id,
        name: business.name,
        logoUrl: business.logoUrl,
        address: business.address,
        phone: business.phone,
    };
}
function toCategorySummary(category) {
    if (!category)
        return null;
    return { id: category.id, name: category.name, slug: category.slug, colorHex: category.colorHex };
}
function toServiceSummary(row) {
    const { service, business, category, nextAvailableSlot } = row;
    return {
        id: service.id,
        name: service.name,
        priceCents: service.priceCents,
        durationMinutes: service.durationMinutes,
        coverImageUrl: service.coverImageUrl,
        cancellationPolicy: service.cancellationPolicy,
        isActive: service.isActive,
        description: service.description,
        business: toBusinessSummary(business),
        category: toCategorySummary(category),
        nextAvailableSlot: nextAvailableSlot !== null && nextAvailableSlot !== void 0 ? nextAvailableSlot : null,
    };
}
function toServiceDetail(row) {
    const { service, business, category } = row;
    return {
        id: service.id,
        name: service.name,
        description: service.description,
        priceCents: service.priceCents,
        durationMinutes: service.durationMinutes,
        coverImageUrl: service.coverImageUrl,
        cancellationPolicy: service.cancellationPolicy,
        isActive: service.isActive,
        business: toBusinessDetail(business),
        category: toCategorySummary(category),
        nextAvailableSlot: null,
    };
}
let ServicesController = class ServicesController {
    constructor(servicesService) {
        this.servicesService = servicesService;
    }
    async findAll(query) {
        const result = await this.servicesService.findAll(query);
        return {
            data: result.data.map(toServiceSummary),
            meta: result.meta,
        };
    }
    async findAllBusinessService(query, user) {
        const result = await this.servicesService.findAllByBusinessUser(query, user.id);
        return result;
    }
    async findById(id) {
        const row = await this.servicesService.findById(id);
        if (!row)
            throw new common_1.NotFoundException('Service not found');
        return toServiceDetail(row);
    }
    async getAvailability(id, query) {
        const slots = await this.servicesService.getAvailability(id, query.date);
        return { date: query.date, slots };
    }
    async create(dto, user) {
        const row = await this.servicesService.createService(dto, user.id, user.role);
        return toServiceDetail(row);
    }
    async update(id, dto, user) {
        const row = await this.servicesService.updateService(id, dto, user.id, user.role);
        return toServiceDetail(row);
    }
    listRules(id, user) {
        return this.servicesService.listRules(id, user.id, user.role);
    }
    createRule(id, dto, user) {
        return this.servicesService.createRule(id, dto, user.id, user.role);
    }
    updateRule(id, ruleId, dto, user) {
        return this.servicesService.updateRule(id, ruleId, dto, user.id, user.role);
    }
    deleteRule(id, ruleId, user) {
        return this.servicesService.deleteRule(id, ruleId, user.id, user.role);
    }
    listBlocks(id, user) {
        return this.servicesService.listBlocks(id, user.id, user.role);
    }
    createBlock(id, dto, user) {
        return this.servicesService.createBlock(id, dto, user.id, user.role);
    }
    updateBlock(id, blockId, dto, user) {
        return this.servicesService.updateBlock(id, blockId, dto, user.id, user.role);
    }
    deleteBlock(id, blockId, user) {
        return this.servicesService.deleteBlock(id, blockId, user.id, user.role);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List active services with filtering, sorting, and pagination' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: {
            example: {
                data: [{ id: 'uuid', name: 'Haircut', priceCents: 3500, durationMinutes: 60 }],
                meta: { total: 100, page: 1, perPage: 12, lastPage: 9 },
            },
        },
    }),
    (0, common_1.UseGuards)(optional_auth_guard_1.OptionalAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [service_list_query_dto_1.ServiceListQueryDto]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)('by-business'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [service_list_query_dto_1.ServiceListQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "findAllBusinessService", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get a single service with full details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    (0, common_1.UseGuards)(optional_auth_guard_1.OptionalAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "findById", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get available time slots for a service on a given date' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'date', description: 'Date in YYYY-MM-DD format', example: '2026-05-01' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    (0, common_1.UseGuards)(optional_auth_guard_1.OptionalAuthGuard),
    (0, common_1.Get)(':id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AvailabilityQueryDto]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "getAvailability", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new service (business_owner or admin)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Returns the created service with relations' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'You do not own this business' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Business or category not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_dto_1.CreateServiceDto, Object]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a service (owner of the business or admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the updated service with relations' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'You do not own this service' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service or category not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_dto_1.UpdateServiceDto, Object]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all recurring availability rules for a service' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of availability rules' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(':id/availability-rules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "listRules", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Add a recurring availability rule to a service' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created availability rule' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'You do not own this service' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(':id/availability-rules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_availability_rule_dto_1.CreateAvailabilityRuleDto, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "createRule", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a recurring availability rule' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated availability rule' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service or rule not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id/availability-rules/:ruleId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ruleId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_availability_rule_dto_1.UpdateAvailabilityRuleDto, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "updateRule", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a recurring availability rule' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiParam)({ name: 'ruleId', description: 'Rule UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service or rule not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.HttpCode)(204),
    (0, common_1.Delete)(':id/availability-rules/:ruleId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ruleId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "deleteRule", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all date-specific availability blocks for a service' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of availability blocks' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)(':id/availability-blocks'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "listBlocks", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Add a date-specific availability block (whole day or time range)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created availability block' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'You do not own this service' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)(':id/availability-blocks'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_availability_block_dto_1.CreateAvailabilityBlockDto, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "createBlock", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a date-specific availability block' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiParam)({ name: 'blockId', description: 'Block UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated availability block' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service or block not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)(':id/availability-blocks/:blockId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('blockId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_availability_block_dto_1.UpdateAvailabilityBlockDto, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "updateBlock", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a date-specific availability block' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service UUID' }),
    (0, swagger_1.ApiParam)({ name: 'blockId', description: 'Block UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204 }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service or block not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.HttpCode)(204),
    (0, common_1.Delete)(':id/availability-blocks/:blockId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('blockId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "deleteBlock", null);
ServicesController = __decorate([
    (0, swagger_1.ApiTags)('services'),
    (0, common_1.Controller)('services'),
    __metadata("design:paramtypes", [services_service_1.ServicesService])
], ServicesController);
exports.ServicesController = ServicesController;
//# sourceMappingURL=services.controller.js.map