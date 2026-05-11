import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewListQueryDto, ReviewStatsQueryDto } from './dto/review-list-query.dto';

function getInitials(fullName: string): string {
  return (fullName ?? '')
    .split(' ')
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .substring(0, 2);
}

function toReviewResponse(row: any) {
  const { review, reviewer } = row;
  return {
    id:               review.id,
    serviceId:        review.serviceId,
    rating:           review.rating,
    comment:          review.comment ?? null,
    reviewerInitials: getInitials(reviewer.fullName),
    reviewerName:     reviewer.fullName,
    createdAt:        review.createdAt,
  };
}

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepository: ReviewsRepository) {}

  async createReview(dto: CreateReviewDto, customerId: string) {
    // 1. Prevent duplicate reviews
    const existing = await this.reviewsRepository.findByCustomerAndService(customerId, dto.serviceId);
    if (existing) {
      throw new ConflictException('You have already reviewed this service');
    }

    // 2. Must have a completed booking for this service
    const hasCompleted = await this.reviewsRepository.checkHasCompletedBooking(customerId, dto.serviceId);
    if (!hasCompleted) {
      throw new ForbiddenException('You must complete a booking for this service before leaving a review');
    }

    const review = await this.reviewsRepository.create({
      serviceId:  dto.serviceId,
      customerId,
      bookingId:  dto.bookingId,
      rating:     dto.rating,
      comment:    dto.comment,
    });

    return {
      id:        review.id,
      serviceId: review.serviceId,
      rating:    review.rating,
      comment:   review.comment ?? null,
      createdAt: review.createdAt,
    };
  }

  async listReviews(query: ReviewListQueryDto) {
    const page    = query.page    ?? 1;
    const perPage = query.perPage ?? 10;
    const { rows, total } = await this.reviewsRepository.findByService(query.serviceId, query);
    return {
      data: rows.map(toReviewResponse),
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async getStats(query: ReviewStatsQueryDto) {
    return this.reviewsRepository.getStats(query.serviceId);
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    if (userRole !== 'admin' && review.customerId !== userId) {
      throw new ForbiddenException('You do not own this review');
    }

    await this.reviewsRepository.delete(reviewId);
    return { message: 'Review deleted' };
  }
}
