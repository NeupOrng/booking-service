import { RedisService } from '../redis/redis.service';
import { SelectCategory } from '../database/schema';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private readonly categoriesRepository;
    private readonly redisService;
    private readonly TTL;
    constructor(categoriesRepository: CategoriesRepository, redisService: RedisService);
    findAll(): Promise<SelectCategory[]>;
    findById(id: string): Promise<SelectCategory | null>;
    findBySlug(slug: string): Promise<SelectCategory | null>;
    create(dto: CreateCategoryDto): Promise<SelectCategory>;
    update(id: string, dto: UpdateCategoryDto): Promise<SelectCategory>;
    invalidateCache(): Promise<void>;
}
