import { RedisService } from '../redis/redis.service';
import { ServicesService } from '../services/services.service';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import { CustomerBookingListQueryDto, BusinessBookingListQueryDto } from './dto/booking-list-query.dto';
export declare class BookingsService {
    private readonly bookingsRepository;
    private readonly servicesService;
    private readonly redisService;
    constructor(bookingsRepository: BookingsRepository, servicesService: ServicesService, redisService: RedisService);
    createBooking(dto: CreateBookingDto, customerId: string): Promise<{
        id: string;
        reference: string;
        status: string;
        service: {
            id: any;
            name: any;
        };
        business: {
            id: any;
            name: any;
        };
        bookingDate: string;
        bookingTime: string;
        priceCents: number;
        durationMinutes: number;
        notesFromCustomer: string;
        canCancel: boolean;
        canReschedule: boolean;
    }>;
    listMyBookings(customerId: string, query: CustomerBookingListQueryDto): Promise<{
        data: {
            customer: any;
            id: any;
            reference: any;
            status: any;
            service: {
                id: any;
                name: any;
                coverImageUrl: any;
                durationMinutes: any;
                category: {
                    slug: any;
                };
            };
            business: any;
            bookingDate: any;
            bookingTime: any;
            priceCents: any;
            cancelledBy: any;
            cancelledAt: any;
            refundStatus: any;
            refundAmount: any;
            notesFromCustomer: any;
            canCancel: boolean;
            canReschedule: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            perPage: number;
            lastPage: number;
        };
    }>;
    myStats(customerId: string): Promise<{
        upcoming: number;
        completed: number;
        totalSpent: number;
    }>;
    cancelMyBooking(bookingId: string, customerId: string, dto: CancelBookingDto): Promise<{
        customer: any;
        id: any;
        reference: any;
        status: any;
        service: {
            id: any;
            name: any;
            coverImageUrl: any;
            durationMinutes: any;
            category: {
                slug: any;
            };
        };
        business: any;
        bookingDate: any;
        bookingTime: any;
        priceCents: any;
        cancelledBy: any;
        cancelledAt: any;
        refundStatus: any;
        refundAmount: any;
        notesFromCustomer: any;
        canCancel: boolean;
        canReschedule: boolean;
    }>;
    listBusinessBookings(userId: string, userRole: string, query: BusinessBookingListQueryDto): Promise<{
        data: {
            customer: any;
            id: any;
            reference: any;
            status: any;
            service: {
                id: any;
                name: any;
                coverImageUrl: any;
                durationMinutes: any;
                category: {
                    slug: any;
                };
            };
            business: any;
            bookingDate: any;
            bookingTime: any;
            priceCents: any;
            cancelledBy: any;
            cancelledAt: any;
            refundStatus: any;
            refundAmount: any;
            notesFromCustomer: any;
            canCancel: boolean;
            canReschedule: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            perPage: number;
            lastPage: number;
        };
    }>;
    updateBookingStatus(bookingId: string, dto: UpdateBookingStatusDto, userId: string, userRole: string): Promise<{
        customer: any;
        id: any;
        reference: any;
        status: any;
        service: {
            id: any;
            name: any;
            coverImageUrl: any;
            durationMinutes: any;
            category: {
                slug: any;
            };
        };
        business: any;
        bookingDate: any;
        bookingTime: any;
        priceCents: any;
        cancelledBy: any;
        cancelledAt: any;
        refundStatus: any;
        refundAmount: any;
        notesFromCustomer: any;
        canCancel: boolean;
        canReschedule: boolean;
    }>;
    cancelBusinessBooking(bookingId: string, userId: string, userRole: string, dto: CancelBookingDto): Promise<{
        customer: any;
        id: any;
        reference: any;
        status: any;
        service: {
            id: any;
            name: any;
            coverImageUrl: any;
            durationMinutes: any;
            category: {
                slug: any;
            };
        };
        business: any;
        bookingDate: any;
        bookingTime: any;
        priceCents: any;
        cancelledBy: any;
        cancelledAt: any;
        refundStatus: any;
        refundAmount: any;
        notesFromCustomer: any;
        canCancel: boolean;
        canReschedule: boolean;
    }>;
}
