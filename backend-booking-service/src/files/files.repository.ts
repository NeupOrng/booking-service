import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { files, InsertFile, SelectFile } from '../database/schema';

@Injectable()
export class FilesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<SelectFile | null> {
    const rows = await this.db.db.select().from(files).where(eq(files.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByIds(ids: string[]): Promise<SelectFile[]> {
    if (ids.length === 0) return [];
    return this.db.db.select().from(files).where(inArray(files.id, ids));
  }

  async create(data: Omit<InsertFile, 'id' | 'createdAt'>): Promise<SelectFile> {
    const [file] = await this.db.db.insert(files).values(data).returning();
    return file;
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(files).where(eq(files.id, id));
  }
}
