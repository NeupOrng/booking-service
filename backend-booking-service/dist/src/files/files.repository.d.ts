import { DatabaseService } from '../database/database.service';
import { InsertFile, SelectFile } from '../database/schema';
export declare class FilesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<SelectFile | null>;
    findByIds(ids: string[]): Promise<SelectFile[]>;
    create(data: Omit<InsertFile, 'id' | 'createdAt'>): Promise<SelectFile>;
    delete(id: string): Promise<void>;
}
