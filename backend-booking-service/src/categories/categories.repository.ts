import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { categories, InsertCategory, SelectCategory } from '../database/schema';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<SelectCategory[]> {
    return this.db.db.select().from(categories).orderBy(asc(categories.sortOrder));
  }

  async findById(id: string): Promise<SelectCategory | null> {
    const rows = await this.db.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<SelectCategory | null> {
    const rows = await this.db.db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: Omit<InsertCategory, 'id' | 'createdAt'>): Promise<SelectCategory> {
    const [row] = await this.db.db.insert(categories).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<InsertCategory>): Promise<SelectCategory | null> {
    const [row] = await this.db.db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return row ?? null;
  }
}
