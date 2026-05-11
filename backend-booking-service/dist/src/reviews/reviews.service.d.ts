import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewListQueryDto, ReviewStatsQueryDto } from './dto/review-list-query.dto';
export declare class ReviewsService {
    private readonly reviewsRepository;
    constructor(reviewsRepository: ReviewsRepository);
    createReview(dto: CreateReviewDto, customerId: string): Promise<{
        id: string;
        serviceId: string;
        rating: number;
        comment: string;
        createdAt: Date;
    }>;
    listReviews(query: ReviewListQueryDto): Promise<{
        data: {
            id: any;
            serviceId: any;
            rating: any;
            comment: any;
            reviewerInitials: string;
            reviewerName: any;
            createdAt: any;
        }[];
        meta: {
            total: number;
            page: number;
            perPage: number;
            lastPage: number;
        };
    }>;
    getStats(query: ReviewStatsQueryDto): Promise<{
        avgRating: number;
        reviewCount: number;
    }>;
    deleteReview(reviewId: string, userId: string, userRole: string): Promise<{
        message: string;
    }>;
}
