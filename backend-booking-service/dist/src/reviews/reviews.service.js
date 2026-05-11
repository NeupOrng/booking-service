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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const reviews_repository_1 = require("./reviews.repository");
function getInitials(fullName) {
    return (fullName !== null && fullName !== void 0 ? fullName : '')
        .split(' ')
        .map((n) => { var _a, _b; return (_b = (_a = n[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== null && _b !== void 0 ? _b : ''; })
        .join('')
        .substring(0, 2);
}
function toReviewResponse(row) {
    var _a;
    const { review, reviewer } = row;
    return {
        id: review.id,
        serviceId: review.serviceId,
        rating: review.rating,
        comment: (_a = review.comment) !== null && _a !== void 0 ? _a : null,
        reviewerInitials: getInitials(reviewer.fullName),
        reviewerName: reviewer.fullName,
        createdAt: review.createdAt,
    };
}
let ReviewsService = class ReviewsService {
    constructor(reviewsRepository) {
        this.reviewsRepository = reviewsRepository;
    }
    async createReview(dto, customerId) {
        var _a;
        const existing = await this.reviewsRepository.findByCustomerAndService(customerId, dto.serviceId);
        if (existing) {
            throw new common_1.ConflictException('You have already reviewed this service');
        }
        const hasCompleted = await this.reviewsRepository.checkHasCompletedBooking(customerId, dto.serviceId);
        if (!hasCompleted) {
            throw new common_1.ForbiddenException('You must complete a booking for this service before leaving a review');
        }
        const review = await this.reviewsRepository.create({
            serviceId: dto.serviceId,
            customerId,
            bookingId: dto.bookingId,
            rating: dto.rating,
            comment: dto.comment,
        });
        return {
            id: review.id,
            serviceId: review.serviceId,
            rating: review.rating,
            comment: (_a = review.comment) !== null && _a !== void 0 ? _a : null,
            createdAt: review.createdAt,
        };
    }
    async listReviews(query) {
        var _a, _b;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const perPage = (_b = query.perPage) !== null && _b !== void 0 ? _b : 10;
        const { rows, total } = await this.reviewsRepository.findByService(query.serviceId, query);
        return {
            data: rows.map(toReviewResponse),
            meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
        };
    }
    async getStats(query) {
        return this.reviewsRepository.getStats(query.serviceId);
    }
    async deleteReview(reviewId, userId, userRole) {
        const review = await this.reviewsRepository.findById(reviewId);
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        if (userRole !== 'admin' && review.customerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this review');
        }
        await this.reviewsRepository.delete(reviewId);
        return { message: 'Review deleted' };
    }
};
ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reviews_repository_1.ReviewsRepository])
], ReviewsService);
exports.ReviewsService = ReviewsService;
//# sourceMappingURL=reviews.service.js.map