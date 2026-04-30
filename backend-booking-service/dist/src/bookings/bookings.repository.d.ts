import { DatabaseService } from '../database/database.service';
import { InsertBooking, SelectBooking } from '../database/schema';
import { CustomerBookingListQueryDto, BusinessBookingListQueryDto } from './dto/booking-list-query.dto';
export declare class BookingsRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: Omit<InsertBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectBooking>;
    writeSlotLockAudit(serviceId: string, slotDate: string, slotTime: string, userId: string, bookingId: string): Promise<void>;
    findById(id: string): Promise<any | null>;
    update(id: string, data: Partial<SelectBooking>): Promise<SelectBooking | null>;
    findByCustomer(customerId: string, query: CustomerBookingListQueryDto): Promise<{
        rows: any[];
        total: number;
    }>;
    customerStats(customerId: string): Promise<{
        upcoming: number;
        completed: number;
        totalSpent: number;
    }>;
    findByBusiness(businessId: string, query: BusinessBookingListQueryDto): Promise<{
        rows: any[];
        total: number;
    }>;
    static bookedStatusValues: readonly ["pending", "confirmed"];
}
