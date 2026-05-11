import { DatabaseService } from '../database/database.service';
import { InsertReview, SelectReview } from '../database/schema';
import { ReviewListQueryDto } from './dto/review-list-query.dto';
export declare class ReviewsRepository {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: Omit<InsertReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectReview>;
    findById(id: string): Promise<SelectReview | null>;
    findByCustomerAndService(customerId: string, serviceId: string): Promise<SelectReview | null>;
    checkHasCompletedBooking(customerId: string, serviceId: string): Promise<boolean>;
    findByService(serviceId: string, query: ReviewListQueryDto): Promise<{
        rows: any[];
        total: number;
    }>;
    getStats(serviceId: string): Promise<{
        avgRating: number | null;
        reviewCount: number;
    }>;
    delete(id: string): Promise<void>;
}
