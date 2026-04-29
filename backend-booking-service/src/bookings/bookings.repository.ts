import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  bookings,
  businesses,
  categories,
  InsertBooking,
  SelectBooking,
  services,
  slotLocks,
  users,
} from '../database/schema';
import { CustomerBookingListQueryDto, BusinessBookingListQueryDto } from './dto/booking-list-query.dto';

const BOOKED_STATUSES = ['pending', 'confirmed'] as const;

function bookingJoinSelect() {
  return {
    booking: bookings,
    service: {
      id: services.id,
      name: services.name,
      coverImageUrl: services.coverImageUrl,
      durationMinutes: services.durationMinutes,
    },
    category: { slug: categories.slug },
    business: { id: businesses.id, name: businesses.name, logo: businesses.logoUrl },
    customer: {
      id: users.id,
      fullName: users.fullName,
      email: users.email,
    }
  };
}

@Injectable()
export class BookingsRepository {
  constructor(private readonly db: DatabaseService) { }

  async create(data: Omit<InsertBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectBooking> {
    const [row] = await this.db.db.insert(bookings).values(data).returning();
    return row;
  }

  async writeSlotLockAudit(
    serviceId: string,
    slotDate: string,
    slotTime: string,
    userId: string,
    bookingId: string,
  ): Promise<void> {
    // expiresAt = slot datetime (appointment time) — audit log never expires before the appointment
    const [datePart] = slotDate.split('T');
    const [h, m] = slotTime.split(':').map(Number);
    const expiresAt = new Date(datePart);
    expiresAt.setHours(h, m, 0, 0);

    await this.db.db.insert(slotLocks).values({
      serviceId,
      slotDate,
      slotTime,
      lockedByUserId: userId,
      expiresAt,
    });
    void bookingId; // stored in Redis key as bookingId; DB row is audit-only
  }

  async findById(id: string): Promise<any | null> {
    const rows = await this.db.db
      .select(bookingJoinSelect())
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(categories, eq(services.categoryId, categories.id))
      .innerJoin(businesses, eq(bookings.businessId, businesses.id))
      .innerJoin(users, eq(bookings.customerId, users.id))
      .where(eq(bookings.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async update(id: string, data: Partial<SelectBooking>): Promise<SelectBooking | null> {
    const [row] = await this.db.db
      .update(bookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return row ?? null;
  }

  // ── Customer queries ────────────────────────────────────────────────────────

  async findByCustomer(
    customerId: string,
    query: CustomerBookingListQueryDto,
  ): Promise<{ rows: any[]; total: number }> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const offset = (page - 1) * perPage;
    const today = new Date().toISOString().substring(0, 10);

    const conditions: any[] = [eq(bookings.customerId, customerId)];

    if (query.status === 'upcoming') {
      conditions.push(inArray(bookings.status, ['pending', 'confirmed']));
      conditions.push(gte(bookings.bookingDate, today));
    } else if (query.status === 'past') {
      conditions.push(eq(bookings.status, 'completed'));
    } else if (query.status === 'cancelled') {
      conditions.push(eq(bookings.status, 'cancelled'));
    }

    const where = and(...conditions);

    const [countResult, rows] = await Promise.all([
      this.db.db.select({ count: count() }).from(bookings).where(where),
      this.db.db
        .select(bookingJoinSelect())
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(categories, eq(services.categoryId, categories.id))
        .innerJoin(businesses, eq(bookings.businessId, businesses.id))
        .innerJoin(users, eq(bookings.customerId, users.id))
        .where(where)
        .orderBy(desc(bookings.bookingDate))
        .limit(perPage)
        .offset(offset),
    ]);

    return { rows, total: Number(countResult[0].count) };
  }

  async customerStats(customerId: string): Promise<{ upcoming: number; completed: number; totalSpent: number }> {
    const today = new Date().toISOString().substring(0, 10);

    const [upcomingResult, completedResult, spentResult] = await Promise.all([
      this.db.db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.customerId, customerId),
            inArray(bookings.status, ['pending', 'confirmed']),
            gte(bookings.bookingDate, today),
          ),
        ),
      this.db.db
        .select({ count: count() })
        .from(bookings)
        .where(and(eq(bookings.customerId, customerId), eq(bookings.status, 'completed'))),
      this.db.db
        .select({ total: sql<string>`COALESCE(SUM(${bookings.priceCents}), 0)` })
        .from(bookings)
        .where(
          and(
            eq(bookings.customerId, customerId),
            inArray(bookings.status, ['confirmed', 'completed']),
          ),
        ),
    ]);

    return {
      upcoming: Number(upcomingResult[0].count),
      completed: Number(completedResult[0].count),
      totalSpent: Number(spentResult[0].total),
    };
  }

  // ── Business queries ────────────────────────────────────────────────────────

  async findByBusiness(
    businessId: string,
    query: BusinessBookingListQueryDto,
  ): Promise<{ rows: any[]; total: number }> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const offset = (page - 1) * perPage;

    const conditions: any[] = [eq(bookings.businessId, businessId)];

    if (query.status) conditions.push(eq(bookings.status, query.status));
    if (query.dateFrom) conditions.push(gte(bookings.bookingDate, query.dateFrom));
    if (query.dateTo) conditions.push(lte(bookings.bookingDate, query.dateTo));

    const where = and(...conditions);

    const [countResult, rows] = await Promise.all([
      this.db.db.select({ count: count() }).from(bookings).where(where),
      this.db.db
        .select(bookingJoinSelect())
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(categories, eq(services.categoryId, categories.id))
        .innerJoin(businesses, eq(bookings.businessId, businesses.id))
        .innerJoin(users, eq(bookings.customerId, users.id))
        .where(where)
        .orderBy(asc(bookings.bookingDate), asc(bookings.bookingTime))
        .limit(perPage)
        .offset(offset),
    ]);

    return { rows, total: Number(countResult[0].count) };
  }

  // ── Booked-slots aggregate (used by ServicesRepository.findBookedSlots) ────
  // This method is called directly from services.repository.ts — kept here for
  // cross-module access via shared DatabaseService (both repositories share the same DB client).
  static bookedStatusValues = BOOKED_STATUSES;
}
