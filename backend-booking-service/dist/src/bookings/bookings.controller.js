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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const cancel_booking_dto_1 = require("./dto/cancel-booking.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const booking_list_query_dto_1 = require("./dto/booking-list-query.dto");
let BookingsController = class BookingsController {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    createBooking(dto, user) {
        return this.bookingsService.createBooking(dto, user.id);
    }
    listMyBookings(query, user) {
        return this.bookingsService.listMyBookings(user.id, query);
    }
    myStats(user) {
        return this.bookingsService.myStats(user.id);
    }
    cancelMyBooking(id, dto, user) {
        return this.bookingsService.cancelMyBooking(id, user.id, dto);
    }
    listBusinessBookings(query, user) {
        return this.bookingsService.listBusinessBookings(user.id, user.role, query);
    }
    updateBookingStatus(id, dto, user) {
        return this.bookingsService.updateBookingStatus(id, dto, user.id, user.role);
    }
    cancelBusinessBooking(id, dto, user) {
        return this.bookingsService.cancelBusinessBooking(id, user.id, user.role, dto);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking (any authenticated user)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Booking created with status pending',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Service not found / slot not available',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'This time slot is fully booked' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createBooking", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "List the current customer's bookings" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated booking list' }),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_list_query_dto_1.CustomerBookingListQueryDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listMyBookings", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get stats for the current customer's bookings" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: { example: { upcoming: 2, completed: 5, totalSpent: 45000 } },
    }),
    (0, common_1.Get)('my/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "myStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Customer cancels their own booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Booking UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking cancelled' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not own booking / already cancelled / completed',
    }),
    (0, common_1.HttpCode)(200),
    (0, common_1.Post)('my/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_booking_dto_1.CancelBookingDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancelMyBooking", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: "List bookings for the current business owner's business",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated booking list with customer info',
    }),
    (0, roles_decorator_1.Roles)('business_owner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)('business'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_list_query_dto_1.BusinessBookingListQueryDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listBusinessBookings", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Business owner updates a booking status (confirmed → completed)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Booking UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid status transition' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found' }),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Patch)('business/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_status_dto_1.UpdateBookingStatusDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateBookingStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Business owner cancels a booking' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Booking UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking cancelled' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Already cancelled / completed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Booking not found' }),
    (0, roles_decorator_1.Roles)('business_owner', 'admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.HttpCode)(200),
    (0, common_1.Post)('business/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_booking_dto_1.CancelBookingDto, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancelBusinessBooking", null);
BookingsController = __decorate([
    (0, swagger_1.ApiTags)('bookings'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
exports.BookingsController = BookingsController;
//# sourceMappingURL=bookings.controller.js.map