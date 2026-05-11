import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewListQueryDto, ReviewStatsQueryDto } from './dto/review-list-query.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ── Public read endpoints ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'List reviews for a service (public, paginated)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        data: [{ id: 'uuid', rating: 5, comment: 'Great!', reviewerInitials: 'JD', createdAt: '2026-05-01T...' }],
        meta: { total: 24, page: 1, perPage: 10, lastPage: 3 },
      },
    },
  })
  @Get()
  listReviews(@Query() query: ReviewListQueryDto) {
    return this.reviewsService.listReviews(query);
  }

  @ApiOperation({ summary: 'Get average rating and review count for a service (public)' })
  @ApiResponse({
    status: 200,
    schema: { example: { avgRating: 4.8, reviewCount: 24 } },
  })
  @Get('stats')
  getStats(@Query() query: ReviewStatsQueryDto) {
    return this.reviewsService.getStats(query);
  }

  // ── Authenticated write endpoints ───────────────────────────────────────────

  @ApiOperation({ summary: 'Submit a review (must have a completed booking for the service)' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 403, description: 'No completed booking for this service' })
  @ApiResponse({ status: 409, description: 'Already reviewed this service' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  createReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reviewsService.createReview(dto, user.id);
  }

  @ApiOperation({ summary: 'Delete own review (or any review if admin)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, schema: { example: { message: 'Review deleted' } } })
  @ApiResponse({ status: 403, description: 'You do not own this review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Delete(':id')
  deleteReview(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.reviewsService.deleteReview(id, user.id, user.role);
  }
}
