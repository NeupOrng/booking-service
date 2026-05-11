import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewListQueryDto, ReviewStatsQueryDto } from './dto/review-list-query.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
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
    createReview(dto: CreateReviewDto, user: {
        id: string;
    }): Promise<{
        id: string;
        serviceId: string;
        rating: number;
        comment: string;
        createdAt: Date;
    }>;
    deleteReview(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
        message: string;
    }>;
}
