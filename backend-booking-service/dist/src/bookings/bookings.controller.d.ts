import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import { CustomerBookingListQueryDto, BusinessBookingListQueryDto } from './dto/booking-list-query.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    createBooking(dto: CreateBookingDto, user: {
        id: string;
    }): Promise<{
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
    listMyBookings(query: CustomerBookingListQueryDto, user: {
        id: string;
    }): Promise<{
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
    myStats(user: {
        id: string;
    }): Promise<{
        upcoming: number;
        completed: number;
        totalSpent: number;
    }>;
    cancelMyBooking(id: string, dto: CancelBookingDto, user: {
        id: string;
    }): Promise<{
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
    listBusinessBookings(query: BusinessBookingListQueryDto, user: {
        id: string;
        role: string;
    }): Promise<{
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
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, user: {
        id: string;
        role: string;
    }): Promise<{
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
    cancelBusinessBooking(id: string, dto: CancelBookingDto, user: {
        id: string;
        role: string;
    }): Promise<{
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
