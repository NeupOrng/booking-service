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
exports.BusinessesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const services_service_1 = require("./services.service");
const business_response_dto_1 = require("./dto/business-response.dto");
const update_business_dto_1 = require("./dto/update-business.dto");
let BusinessesController = class BusinessesController {
    constructor(servicesService) {
        this.servicesService = servicesService;
    }
    async getMyBusiness(user) {
        const business = await this.servicesService.findBusinessByOwner(user.id);
        if (!business)
            throw new common_1.NotFoundException('Business not found');
        return new business_response_dto_1.BusinessResponseDto(business);
    }
    async updateBusiness(id, dto, user) {
        const business = await this.servicesService.updateBusiness(id, dto, user.id, user.role);
        return new business_response_dto_1.BusinessResponseDto(business);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get the business profile for the current business owner' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: business_response_dto_1.BusinessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Business not found' }),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getMyBusiness", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a business profile (owner or admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Business UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: business_response_dto_1.BusinessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'You do not own this business' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Business not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Business slug already in use' }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_business_dto_1.UpdateBusinessDto, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateBusiness", null);
BusinessesController = __decorate([
    (0, swagger_1.ApiTags)('businesses'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('businesses'),
    __metadata("design:paramtypes", [services_service_1.ServicesService])
], BusinessesController);
exports.BusinessesController = BusinessesController;
//# sourceMappingURL=businesses.controller.js.map