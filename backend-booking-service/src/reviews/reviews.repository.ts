import { Injectable } from '@nestjs/common';
import { and, avg, count, desc, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  bookings,
  InsertReview,
  reviews,
  SelectReview,
  users,
} from '../database/schema';
import { ReviewListQueryDto } from './dto/review-list-query.dto';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: Omit<InsertReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectReview> {
    const [row] = await this.db.db.insert(reviews).values(data).returning();
    return row;
  }

  async findById(id: string): Promise<SelectReview | null> {
    const rows = await this.db.db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByCustomerAndService(customerId: string, serviceId: string): Promise<SelectReview | null> {
    const rows = await this.db.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.customerId, customerId), eq(reviews.serviceId, serviceId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async checkHasCompletedBooking(customerId: string, serviceId: string): Promise<boolean> {
    const rows = await this.db.db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, customerId),
          eq(bookings.serviceId, serviceId),
          eq(bookings.status, 'completed'),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async findByService(
    serviceId: string,
    query: ReviewListQueryDto,
  ): Promise<{ rows: any[]; total: number }> {
    const page    = query.page    ?? 1;
    const perPage = query.perPage ?? 10;
    const offset  = (page - 1) * perPage;
    const where   = eq(reviews.serviceId, serviceId);

    const [countResult, rows] = await Promise.all([
      this.db.db.select({ count: count() }).from(reviews).where(where),
      this.db.db
        .select({
          review: reviews,
          reviewer: {
            id:       users.id,
            fullName: users.fullName,
          },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.customerId, users.id))
        .where(where)
        .orderBy(desc(reviews.createdAt))
        .limit(perPage)
        .offset(offset),
    ]);

    return { rows, total: Number(countResult[0].count) };
  }

  async getStats(serviceId: string): Promise<{ avgRating: number | null; reviewCount: number }> {
    const [result] = await this.db.db
      .select({
        avgRating:   avg(reviews.rating),
        reviewCount: count(),
      })
      .from(reviews)
      .where(eq(reviews.serviceId, serviceId));

    return {
      avgRating:   result.avgRating ? parseFloat(result.avgRating as unknown as string) : null,
      reviewCount: Number(result.reviewCount),
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.db.delete(reviews).where(eq(reviews.id, id));
  }
}
