import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<CategoryResponseDto[]>;
    findBySlug(slug: string): Promise<CategoryResponseDto>;
    create(dto: CreateCategoryDto): Promise<CategoryResponseDto>;
    update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto>;
}
