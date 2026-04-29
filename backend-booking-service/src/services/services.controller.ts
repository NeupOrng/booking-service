import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ServicesService } from './services.service';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { UpdateAvailabilityBlockDto } from './dto/update-availability-block.dto';

class AvailabilityQueryDto {
  @IsDateString() date: string;
}

function toBusinessSummary(business: any) {
  return { id: business.id, name: business.name, logoUrl: business.logoUrl };
}

function toBusinessDetail(business: any) {
  return {
    id: business.id,
    name: business.name,
    logoUrl: business.logoUrl,
    address: business.address,
    phone: business.phone,
  };
}

function toCategorySummary(category: any) {
  if (!category) return null;
  return { id: category.id, name: category.name, slug: category.slug, colorHex: category.colorHex };
}

function toServiceSummary(row: any) {
  const { service, business, category, nextAvailableSlot } = row;
  return {
    id: service.id,
    name: service.name,
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
    coverImageUrl: service.coverImageUrl,
    cancellationPolicy: service.cancellationPolicy,
    business: toBusinessSummary(business),
    category: toCategorySummary(category),
    nextAvailableSlot: nextAvailableSlot ?? null,
  };
}

function toServiceDetail(row: any) {
  const { service, business, category } = row;
  
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
    coverImageUrl: service.coverImageUrl,
    cancellationPolicy: service.cancellationPolicy,
    isActive: service.isActive,
    business: toBusinessDetail(business),
    category: toCategorySummary(category),
    nextAvailableSlot: null,
  };
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ── Public / optional-auth read endpoints ──────────────────────────────────

  @ApiOperation({ summary: 'List active services with filtering, sorting, and pagination' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        data: [{ id: 'uuid', name: 'Haircut', priceCents: 3500, durationMinutes: 60 }],
        meta: { total: 100, page: 1, perPage: 12, lastPage: 9 },
      },
    },
  })
  @UseGuards(OptionalAuthGuard)
  @Get()
  async findAll(@Query() query: ServiceListQueryDto) {
    const result = await this.servicesService.findAll(query);
    return {
      data: result.data.map(toServiceSummary),
      meta: result.meta,
    };
  }
  
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('by-business')
  async findAllBusinessService(
    @Query() query: ServiceListQueryDto, 
    @CurrentUser() user
  ) {
    const result = await this.servicesService.findAllByBusinessUser(query, user.id);
    return result;
  }


  @ApiOperation({ summary: 'Get a single service with full details' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    const row = await this.servicesService.findById(id);
    if (!row) throw new NotFoundException('Service not found');
    return toServiceDetail(row);
  }

  @ApiOperation({ summary: 'Get available time slots for a service on a given date' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format', example: '2026-05-01' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @UseGuards(OptionalAuthGuard)
  @Get(':id/availability')
  async getAvailability(
    @Param('id') id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    const slots = await this.servicesService.getAvailability(id, query.date);
    return { date: query.date, slots };
  }

  // ── business_owner / admin write endpoints ──────────────────────────────────

  @ApiOperation({ summary: 'Create a new service (business_owner or admin)' })
  @ApiResponse({ status: 201, description: 'Returns the created service with relations' })
  @ApiResponse({ status: 403, description: 'You do not own this business' })
  @ApiResponse({ status: 404, description: 'Business or category not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const row = await this.servicesService.createService(dto, user.id, user.role);
    return toServiceDetail(row);
  }

  @ApiOperation({ summary: 'Update a service (owner of the business or admin)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Returns the updated service with relations' })
  @ApiResponse({ status: 403, description: 'You do not own this service' })
  @ApiResponse({ status: 404, description: 'Service or category not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const row = await this.servicesService.updateService(id, dto, user.id, user.role);
    Logger.log("row {}", row)
    return toServiceDetail(row);
  }

  // ── Availability rules ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all recurring availability rules for a service' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Array of availability rules' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/availability-rules')
  listRules(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.listRules(id, user.id, user.role);
  }

  @ApiOperation({ summary: 'Add a recurring availability rule to a service' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 201, description: 'Created availability rule' })
  @ApiResponse({ status: 403, description: 'You do not own this service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/availability-rules')
  createRule(
    @Param('id') id: string,
    @Body() dto: CreateAvailabilityRuleDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.createRule(id, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Update a recurring availability rule' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiParam({ name: 'ruleId', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Updated availability rule' })
  @ApiResponse({ status: 404, description: 'Service or rule not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/availability-rules/:ruleId')
  updateRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateAvailabilityRuleDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.updateRule(id, ruleId, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Delete a recurring availability rule' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiParam({ name: 'ruleId', description: 'Rule UUID' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Service or rule not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(204)
  @Delete(':id/availability-rules/:ruleId')
  deleteRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.deleteRule(id, ruleId, user.id, user.role);
  }

  // ── Availability blocks ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all date-specific availability blocks for a service' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Array of availability blocks' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/availability-blocks')
  listBlocks(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.listBlocks(id, user.id, user.role);
  }

  @ApiOperation({ summary: 'Add a date-specific availability block (whole day or time range)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 201, description: 'Created availability block' })
  @ApiResponse({ status: 403, description: 'You do not own this service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/availability-blocks')
  createBlock(
    @Param('id') id: string,
    @Body() dto: CreateAvailabilityBlockDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.createBlock(id, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Update a date-specific availability block' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiParam({ name: 'blockId', description: 'Block UUID' })
  @ApiResponse({ status: 200, description: 'Updated availability block' })
  @ApiResponse({ status: 404, description: 'Service or block not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/availability-blocks/:blockId')
  updateBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @Body() dto: UpdateAvailabilityBlockDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.updateBlock(id, blockId, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Delete a date-specific availability block' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiParam({ name: 'blockId', description: 'Block UUID' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Service or block not found' })
  @ApiBearerAuth('access-token')
  @Roles('business_owner', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(204)
  @Delete(':id/availability-blocks/:blockId')
  deleteBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.servicesService.deleteBlock(id, blockId, user.id, user.role);
  }
}
