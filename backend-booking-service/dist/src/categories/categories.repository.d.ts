import { DatabaseService } from '../database/database.service';
import { InsertCategory, SelectCategory } from '../database/schema';
export declare class CategoriesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): Promise<SelectCategory[]>;
    findById(id: string): Promise<SelectCategory | null>;
    findBySlug(slug: string): Promise<SelectCategory | null>;
    create(data: Omit<InsertCategory, 'id' | 'createdAt'>): Promise<SelectCategory>;
    update(id: string, data: Partial<InsertCategory>): Promise<SelectCategory | null>;
}
