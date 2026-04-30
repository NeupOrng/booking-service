import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ServicesService } from '../services/services.service';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import {
    CustomerBookingListQueryDto,
    BusinessBookingListQueryDto,
} from './dto/booking-list-query.dto';
import { toBookingResponse } from '../common/utils';

const VALID_BUSINESS_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

function generateReference(): string {
    return `#BK-${Math.floor(10000 + Math.random() * 90000)}`;
}

@Injectable()
export class BookingsService {
    constructor(
        private readonly bookingsRepository: BookingsRepository,
        private readonly servicesService: ServicesService,
        private readonly redisService: RedisService,
    ) {}

    // ── Create booking ──────────────────────────────────────────────────────────

    async createBooking(dto: CreateBookingDto, customerId: string) {
        // 1. Verify service is active and fetch its data
        const serviceRow = await this.servicesService.findById(dto.serviceId);
        if (!serviceRow) throw new NotFoundException('Service not found');
        const { service, business } = serviceRow;

        // 2. Check slot availability (includes Redis lock counts + DB booked counts)
        const slots = await this.servicesService.getAvailability(
            dto.serviceId,
            dto.bookingDate,
        );
        const slot = slots.find((s) => s.time === dto.bookingTime);

        if (!slot)
            throw new NotFoundException('This time slot is not available');
        if (!slot.available)
            throw new ConflictException('This time slot is fully booked');

        // 3. Create booking row
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

        // 4. Write slot_lock audit record (silently — never crash on audit failure)
        try {
            await this.bookingsRepository.writeSlotLockAudit(
                dto.serviceId,
                dto.bookingDate,
                dto.bookingTime,
                customerId,
                booking.id,
            );
        } catch {}

        // 5. Optionally set a Redis key for the booked slot so availability updates immediately
        //    before the next DB read (best-effort — Redis failure is silently ignored)
        try {
            const lockKey = `slot_lock:${dto.serviceId}:${dto.bookingDate}:${dto.bookingTime}:${booking.id}`;
            // 24h TTL — will be cleaned up once BookingsModule fully manages locks
            await this.redisService.client.set(
                lockKey,
                customerId,
                'EX',
                86400,
            );
        } catch {}

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
            notesFromCustomer: booking.notesFromCustomer ?? null,
            canCancel: true,
            canReschedule: true,
        };
    }

    // ── Customer endpoints ──────────────────────────────────────────────────────

    async listMyBookings(
        customerId: string,
        query: CustomerBookingListQueryDto,
    ) {
        const page = query.page ?? 1;
        const perPage = query.perPage ?? 10;
        const { rows, total } = await this.bookingsRepository.findByCustomer(
            customerId,
            query,
        );
        return {
            data: rows.map((r) => toBookingResponse(r, true)),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async myStats(customerId: string) {
        return this.bookingsRepository.customerStats(customerId);
    }

    async cancelMyBooking(
        bookingId: string,
        customerId: string,
        dto: CancelBookingDto,
    ) {
        const row = await this.bookingsRepository.findById(bookingId);
        if (!row) throw new NotFoundException('Booking not found');
        if (row.booking.customerId !== customerId)
            throw new ForbiddenException('You do not own this booking');
        if (row.booking.status === 'cancelled')
            throw new ForbiddenException('This booking is already cancelled');
        if (row.booking.status === 'completed')
            throw new ForbiddenException('You cannot cancel this booking');

        const updated = await this.bookingsRepository.update(bookingId, {
            status: 'cancelled',
            cancelledBy: 'customer',
            cancelledAt: new Date(),
        });

        // Remove the Redis slot lock so the slot becomes available again
        try {
            const keys = await this.redisService.client.keys(
                `slot_lock:${row.booking.serviceId}:${row.booking.bookingDate}:${row.booking.bookingTime}:${bookingId}`,
            );
            if (keys.length) await this.redisService.client.del(...keys);
        } catch {}

        void dto; // reason tracked via audit log in future
        return toBookingResponse({ ...row, booking: updated }, true);
    }

    // ── Business owner endpoints ────────────────────────────────────────────────

    async listBusinessBookings(
        userId: string,
        userRole: string,
        query: BusinessBookingListQueryDto,
    ) {
        let businessId: string;

        if (userRole === 'admin' && (query as any).businessId) {
            businessId = (query as any).businessId;
        } else {
            const business = await this.servicesService.findBusinessByOwner(
                userId,
            );
            if (!business) throw new NotFoundException('Business not found');
            businessId = business.id;
        }

        const page = query.page ?? 1;
        const perPage = query.perPage ?? 10;
        const { rows, total } = await this.bookingsRepository.findByBusiness(
            businessId,
            query,
        );
        return {
            data: rows.map((r) => toBookingResponse(r, true)),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async updateBookingStatus(
        bookingId: string,
        dto: UpdateBookingStatusDto,
        userId: string,
        userRole: string,
    ) {
        const row = await this.bookingsRepository.findById(bookingId);

        // No info leak for business owner — 404 instead of 403
        if (!row) throw new NotFoundException('Booking not found');

        if (userRole !== 'admin') {
            const business = await this.servicesService.findBusinessByOwner(
                userId,
            );
            if (!business || row.booking.businessId !== business.id) {
                throw new NotFoundException('Booking not found');
            }
        }

        const allowed = VALID_BUSINESS_TRANSITIONS[row.booking.status] ?? [];
        if (!allowed.includes(dto.status)) {
            throw new BadRequestException('Invalid status transition');
        }

        const updateData = { status: dto.status };
        if (dto.status === 'completed') {
            updateData['completedAt'] = new Date();
        }

        const updated = await this.bookingsRepository.update(
            bookingId,
            updateData,
        );
        return toBookingResponse({ ...row, booking: updated }, true);
    }

    async cancelBusinessBooking(
        bookingId: string,
        userId: string,
        userRole: string,
        dto: CancelBookingDto,
    ) {
        const row = await this.bookingsRepository.findById(bookingId);

        if (!row) throw new NotFoundException('Booking not found');

        if (userRole !== 'admin') {
            const business = await this.servicesService.findBusinessByOwner(
                userId,
            );
            if (!business || row.booking.businessId !== business.id) {
                throw new NotFoundException('Booking not found');
            }
        }

        if (row.booking.status === 'cancelled')
            throw new ForbiddenException('This booking is already cancelled');
        if (row.booking.status === 'completed')
            throw new ForbiddenException('You cannot cancel this booking');

        const updated = await this.bookingsRepository.update(bookingId, {
            status: 'cancelled',
            cancelledBy: 'business',
            cancelledAt: new Date(),
        });

        try {
            const keys = await this.redisService.client.keys(
                `slot_lock:${row.booking.serviceId}:${row.booking.bookingDate}:${row.booking.bookingTime}:${bookingId}`,
            );
            if (keys.length) await this.redisService.client.del(...keys);
        } catch {}

        void dto;
        return toBookingResponse({ ...row, booking: updated }, true);
    }
}
