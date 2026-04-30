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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const services_service_1 = require("../services/services.service");
const bookings_repository_1 = require("./bookings.repository");
const utils_1 = require("../common/utils");
const VALID_BUSINESS_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};
function generateReference() {
    return `#BK-${Math.floor(10000 + Math.random() * 90000)}`;
}
let BookingsService = class BookingsService {
    constructor(bookingsRepository, servicesService, redisService) {
        this.bookingsRepository = bookingsRepository;
        this.servicesService = servicesService;
        this.redisService = redisService;
    }
    async createBooking(dto, customerId) {
        var _a;
        const serviceRow = await this.servicesService.findById(dto.serviceId);
        if (!serviceRow)
            throw new common_1.NotFoundException('Service not found');
        const { service, business } = serviceRow;
        const slots = await this.servicesService.getAvailability(dto.serviceId, dto.bookingDate);
        const slot = slots.find((s) => s.time === dto.bookingTime);
        if (!slot)
            throw new common_1.NotFoundException('This time slot is not available');
        if (!slot.available)
            throw new common_1.ConflictException('This time slot is fully booked');
        const reference = generateReference();
        const booking = await this.bookingsRepository.create({
            serviceId: dto.serviceId,
            customerId,
            businessId: service.businessId,
            reference,
            bookingDate: dto.bookingDate,
            bookingTime: dto.bookingTime,
            status: 'pending',
            priceCents: service.priceCents,
            durationMinutes: service.durationMinutes,
            notesFromCustomer: dto.notesFromCustomer,
        });
        try {
            await this.bookingsRepository.writeSlotLockAudit(dto.serviceId, dto.bookingDate, dto.bookingTime, customerId, booking.id);
        }
        catch (_b) { }
        try {
            const lockKey = `slot_lock:${dto.serviceId}:${dto.bookingDate}:${dto.bookingTime}:${booking.id}`;
            await this.redisService.client.set(lockKey, customerId, 'EX', 86400);
        }
        catch (_c) { }
        return {
            id: booking.id,
            reference: booking.reference,
            status: booking.status,
            service: { id: service.id, name: service.name },
            business: { id: business.id, name: business.name },
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            priceCents: booking.priceCents,
            durationMinutes: booking.durationMinutes,
            notesFromCustomer: (_a = booking.notesFromCustomer) !== null && _a !== void 0 ? _a : null,
            canCancel: true,
            canReschedule: true,
        };
    }
    async listMyBookings(customerId, query) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 10;
        const { rows, total } = await this.bookingsRepository.findByCustomer(customerId, query);
        return {
            data: rows.map((r) => (0, utils_1.toBookingResponse)(r, true)),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }
    async myStats(customerId) {
        return this.bookingsRepository.customerStats(customerId);
    }
    async cancelMyBooking(bookingId, customerId, dto) {
        const row = await this.bookingsRepository.findById(bookingId);
        if (!row)
            throw new common_1.NotFoundException('Booking not found');
        if (row.booking.customerId !== customerId)
            throw new common_1.ForbiddenException('You do not own this booking');
        if (row.booking.status === 'cancelled')
            throw new common_1.ForbiddenException('This booking is already cancelled');
        if (row.booking.status === 'completed')
            throw new common_1.ForbiddenException('You cannot cancel this booking');
        const updated = await this.bookingsRepository.update(bookingId, {
            status: 'cancelled',
            cancelledBy: 'customer',
            cancelledAt: new Date(),
        });
        try {
            const keys = await this.redisService.client.keys(`slot_lock:${row.booking.serviceId}:${row.booking.bookingDate}:${row.booking.bookingTime}:${bookingId}`);
            if (keys.length)
                await this.redisService.client.del(...keys);
        }
        catch (_a) { }
        void dto;
        return (0, utils_1.toBookingResponse)(Object.assign(Object.assign({}, row), { booking: updated }), true);
    }
    async listBusinessBookings(userId, userRole, query) {
        var _a, _b;
        let businessId;
        if (userRole === 'admin' && query.businessId) {
            businessId = query.businessId;
        }
        else {
            const business = await this.servicesService.findBusinessByOwner(userId);
            if (!business)
                throw new common_1.NotFoundException('Business not found');
            businessId = business.id;
        }
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 10;
        const { rows, total } = await this.bookingsRepository.findByBusiness(businessId, query);
        return {
            data: rows.map((r) => (0, utils_1.toBookingResponse)(r, true)),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }
    async updateBookingStatus(bookingId, dto, userId, userRole) {
        var _a;
        const row = await this.bookingsRepository.findById(bookingId);
        if (!row)
            throw new common_1.NotFoundException('Booking not found');
        if (userRole !== 'admin') {
            const business = await this.servicesService.findBusinessByOwner(userId);
            if (!business || row.booking.businessId !== business.id) {
                throw new common_1.NotFoundException('Booking not found');
            }
        }
        const allowed = (_a = VALID_BUSINESS_TRANSITIONS[row.booking.status]) !== null && _a !== void 0 ? _a : [];
        if (!allowed.includes(dto.status)) {
            throw new common_1.BadRequestException('Invalid status transition');
        }
        const updateData = { status: dto.status };
        if (dto.status === 'completed') {
            updateData['completedAt'] = new Date();
        }
        const updated = await this.bookingsRepository.update(bookingId, updateData);
        return (0, utils_1.toBookingResponse)(Object.assign(Object.assign({}, row), { booking: updated }), true);
    }
    async cancelBusinessBooking(bookingId, userId, userRole, dto) {
        const row = await this.bookingsRepository.findById(bookingId);
        if (!row)
            throw new common_1.NotFoundException('Booking not found');
        if (userRole !== 'admin') {
            const business = await this.servicesService.findBusinessByOwner(userId);
            if (!business || row.booking.businessId !== business.id) {
                throw new common_1.NotFoundException('Booking not found');
            }
        }
        if (row.booking.status === 'cancelled')
            throw new common_1.ForbiddenException('This booking is already cancelled');
        if (row.booking.status === 'completed')
            throw new common_1.ForbiddenException('You cannot cancel this booking');
        const updated = await this.bookingsRepository.update(bookingId, {
            status: 'cancelled',
            cancelledBy: 'business',
            cancelledAt: new Date(),
        });
        try {
            const keys = await this.redisService.client.keys(`slot_lock:${row.booking.serviceId}:${row.booking.bookingDate}:${row.booking.bookingTime}:${bookingId}`);
            if (keys.length)
                await this.redisService.client.del(...keys);
        }
        catch (_a) { }
        void dto;
        return (0, utils_1.toBookingResponse)(Object.assign(Object.assign({}, row), { booking: updated }), true);
    }
};
BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookings_repository_1.BookingsRepository,
        services_service_1.ServicesService,
        redis_service_1.RedisService])
], BookingsService);
exports.BookingsService = BookingsService;
//# sourceMappingURL=bookings.service.js.map