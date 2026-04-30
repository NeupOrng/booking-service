import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Patch,
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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import {
    CustomerBookingListQueryDto,
    BusinessBookingListQueryDto,
} from './dto/booking-list-query.dto';

@ApiTags('bookings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) {}

    // ── Customer endpoints ──────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Create a new booking (any authenticated user)' })
    @ApiResponse({
        status: 201,
        description: 'Booking created with status pending',
    })
    @ApiResponse({
        status: 404,
        description: 'Service not found / slot not available',
    })
    @ApiResponse({ status: 409, description: 'This time slot is fully booked' })
    @Post()
    createBooking(
        @Body() dto: CreateBookingDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.bookingsService.createBooking(dto, user.id);
    }

    @ApiOperation({ summary: "List the current customer's bookings" })
    @ApiResponse({ status: 200, description: 'Paginated booking list' })
    @Get('my')
    listMyBookings(
        @Query() query: CustomerBookingListQueryDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.bookingsService.listMyBookings(user.id, query);
    }

    @ApiOperation({ summary: "Get stats for the current customer's bookings" })
    @ApiResponse({
        status: 200,
        schema: { example: { upcoming: 2, completed: 5, totalSpent: 45000 } },
    })
    @Get('my/stats')
    myStats(@CurrentUser() user: { id: string }) {
        return this.bookingsService.myStats(user.id);
    }

    @ApiOperation({ summary: 'Customer cancels their own booking' })
    @ApiParam({ name: 'id', description: 'Booking UUID' })
    @ApiResponse({ status: 200, description: 'Booking cancelled' })
    @ApiResponse({
        status: 403,
        description: 'Not own booking / already cancelled / completed',
    })
    @HttpCode(200)
    @Post('my/:id/cancel')
    cancelMyBooking(
        @Param('id') id: string,
        @Body() dto: CancelBookingDto,
        @CurrentUser() user: { id: string },
    ) {
        return this.bookingsService.cancelMyBooking(id, user.id, dto);
    }

    // ── Business owner endpoints ────────────────────────────────────────────────

    @ApiOperation({
        summary: "List bookings for the current business owner's business",
    })
    @ApiResponse({
        status: 200,
        description: 'Paginated booking list with customer info',
    })
    @Roles('business_owner')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('business')
    listBusinessBookings(
        @Query() query: BusinessBookingListQueryDto,
        @CurrentUser() user: { id: string; role: string },
    ) {
        return this.bookingsService.listBusinessBookings(
            user.id,
            user.role,
            query,
        );
    }

    @ApiOperation({
        summary:
            'Business owner updates a booking status (confirmed → completed)',
    })
    @ApiParam({ name: 'id', description: 'Booking UUID' })
    @ApiResponse({ status: 200, description: 'Status updated' })
    @ApiResponse({ status: 400, description: 'Invalid status transition' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    @Roles('business_owner', 'admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch('business/:id/status')
    updateBookingStatus(
        @Param('id') id: string,
        @Body() dto: UpdateBookingStatusDto,
        @CurrentUser() user: { id: string; role: string },
    ) {
        return this.bookingsService.updateBookingStatus(
            id,
            dto,
            user.id,
            user.role,
        );
    }

    @ApiOperation({ summary: 'Business owner cancels a booking' })
    @ApiParam({ name: 'id', description: 'Booking UUID' })
    @ApiResponse({ status: 200, description: 'Booking cancelled' })
    @ApiResponse({ status: 403, description: 'Already cancelled / completed' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    @Roles('business_owner', 'admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @HttpCode(200)
    @Post('business/:id/cancel')
    cancelBusinessBooking(
        @Param('id') id: string,
        @Body() dto: CancelBookingDto,
        @CurrentUser() user: { id: string; role: string },
    ) {
        return this.bookingsService.cancelBusinessBooking(
            id,
            user.id,
            user.role,
            dto,
        );
    }
}
