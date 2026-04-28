import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
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
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ── Public read endpoints ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all categories (public, Redis-cached)' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  @Get()
  async findAll(): Promise<CategoryResponseDto[]> {
    const rows = await this.categoriesService.findAll();
    return rows.map((r) => new CategoryResponseDto(r));
  }

  @ApiOperation({ summary: 'Get a single category by slug' })
  @ApiParam({ name: 'slug', example: 'hair-beauty' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    const row = await this.categoriesService.findBySlug(slug);
    if (!row) throw new NotFoundException('Category not found');
    return new CategoryResponseDto(row);
  }

  // ── Admin-only write endpoints ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new category (admin only)' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  @ApiBearerAuth('access-token')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const row = await this.categoriesService.create(dto);
    return new CategoryResponseDto(row);
  }

  @ApiOperation({ summary: 'Update a category by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  @ApiBearerAuth('access-token')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const row = await this.categoriesService.update(id, dto);
    return new CategoryResponseDto(row);
  }
}
