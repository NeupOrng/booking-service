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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const reviews_service_1 = require("./reviews.service");
const create_review_dto_1 = require("./dto/create-review.dto");
const review_list_query_dto_1 = require("./dto/review-list-query.dto");
let ReviewsController = class ReviewsController {
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    listReviews(query) {
        return this.reviewsService.listReviews(query);
    }
    getStats(query) {
        return this.reviewsService.getStats(query);
    }
    createReview(dto, user) {
        return this.reviewsService.createReview(dto, user.id);
    }
    deleteReview(id, user) {
        return this.reviewsService.deleteReview(id, user.id, user.role);
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List reviews for a service (public, paginated)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: {
            example: {
                data: [{ id: 'uuid', rating: 5, comment: 'Great!', reviewerInitials: 'JD', createdAt: '2026-05-01T...' }],
                meta: { total: 24, page: 1, perPage: 10, lastPage: 3 },
            },
        },
    }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_list_query_dto_1.ReviewListQueryDto]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "listReviews", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get average rating and review count for a service (public)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: { example: { avgRating: 4.8, reviewCount: 24 } },
    }),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_list_query_dto_1.ReviewStatsQueryDto]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Submit a review (must have a completed booking for the service)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Review created' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'No completed booking for this service' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already reviewed this service' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_review_dto_1.CreateReviewDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createReview", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete own review (or any review if admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Review UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, schema: { example: { message: 'Review deleted' } } }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'You do not own this review' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Review not found' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(200),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "deleteReview", null);
ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('reviews'),
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
exports.ReviewsController = ReviewsController;
//# sourceMappingURL=reviews.controller.js.map