import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SelectCategory } from '../database/schema';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly TTL = 3600;

  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly redisService: RedisService,
  ) {}

  async findAll(): Promise<SelectCategory[]> {
    try {
      const cached = await this.redisService.client.get('categories:all');
      if (cached) return JSON.parse(cached);
    } catch {}

    const rows = await this.categoriesRepository.findAll();

    try {
      await this.redisService.client.set('categories:all', JSON.stringify(rows), 'EX', this.TTL);
    } catch {}

    return rows;
  }

  async findById(id: string): Promise<SelectCategory | null> {
    return this.categoriesRepository.findById(id);
  }

  async findBySlug(slug: string): Promise<SelectCategory | null> {
    const key = `categories:slug:${slug}`;

    try {
      const cached = await this.redisService.client.get(key);
      if (cached) return JSON.parse(cached);
    } catch {}

    const row = await this.categoriesRepository.findBySlug(slug);

    if (row) {
      try {
        await this.redisService.client.set(key, JSON.stringify(row), 'EX', this.TTL);
      } catch {}
    }

    return row;
  }

  async create(dto: CreateCategoryDto): Promise<SelectCategory> {
    const existing = await this.categoriesRepository.findBySlug(dto.slug);
    if (existing) throw new ConflictException(`Slug "${dto.slug}" is already in use`);

    const category = await this.categoriesRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      colorHex: dto.colorHex,
      sortOrder: dto.sortOrder ?? 0,
    });

    await this.invalidateCache();
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<SelectCategory> {
    if (dto.slug) {
      const conflict = await this.categoriesRepository.findBySlug(dto.slug);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    const updated = await this.categoriesRepository.update(id, dto);
    if (!updated) throw new NotFoundException('Category not found');

    await this.invalidateCache();
    return updated;
  }

  async invalidateCache(): Promise<void> {
    try {
      const slugKeys = await this.redisService.client.keys('categories:slug:*');
      const keysToDelete = ['categories:all', ...slugKeys];
      if (keysToDelete.length) {
        await this.redisService.client.del(...keysToDelete);
      }
    } catch {}
  }
}
