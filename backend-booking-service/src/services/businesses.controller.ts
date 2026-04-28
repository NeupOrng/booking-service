import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
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
import { ServicesService } from './services.service';
import { BusinessResponseDto } from './dto/business-response.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('businesses')
@ApiBearerAuth('access-token')
@Roles('business_owner', 'admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: 'Get the business profile for the current business owner' })
  @ApiResponse({ status: 200, type: BusinessResponseDto })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @Get('me')
  async getMyBusiness(@CurrentUser() user: { id: string; role: string }): Promise<BusinessResponseDto> {
    const business = await this.servicesService.findBusinessByOwner(user.id);
    if (!business) throw new NotFoundException('Business not found');
    return new BusinessResponseDto(business);
  }

  @ApiOperation({ summary: 'Update a business profile (owner or admin)' })
  @ApiParam({ name: 'id', description: 'Business UUID' })
  @ApiResponse({ status: 200, type: BusinessResponseDto })
  @ApiResponse({ status: 403, description: 'You do not own this business' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  @ApiResponse({ status: 409, description: 'Business slug already in use' })
  @Patch(':id')
  async updateBusiness(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<BusinessResponseDto> {
    const business = await this.servicesService.updateBusiness(id, dto, user.id, user.role);
    return new BusinessResponseDto(business);
  }
}
