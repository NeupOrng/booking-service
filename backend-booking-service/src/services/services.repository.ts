import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  availabilityBlocks,
  availabilityRules,
  businesses,
  categories,
  InsertAvailabilityBlock,
  InsertAvailabilityRule,
  InsertBusiness,
  InsertService,
  SelectAvailabilityBlock,
  SelectAvailabilityRule,
  SelectBusiness,
  SelectService,
  services,
} from '../database/schema';
import { ServiceListQueryDto } from './dto/service-list-query.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(query: ServiceListQueryDto): Promise<{ rows: any[]; total: number }> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 12;
    const offset = (page - 1) * perPage;

    const conditions: any[] = [eq(services.isActive, true)];

    if (query.q) {
      conditions.push(
        or(
          ilike(services.name, `%${query.q}%`),
          ilike(businesses.name, `%${query.q}%`),
        ),
      );
    }
    if (query.categoryId) {
      conditions.push(eq(services.categoryId, query.categoryId));
    }

    const where = and(...conditions);

    const orderBy = (() => {
      switch (query.sort) {
        case 'price_asc':    return asc(services.priceCents);
        case 'price_desc':   return desc(services.priceCents);
        case 'duration_asc': return asc(services.durationMinutes);
        default:             return asc(services.createdAt);
      }
    })();

    const [countResult, rows] = await Promise.all([
      this.db.db
        .select({ count: count() })
        .from(services)
        .innerJoin(businesses, eq(services.businessId, businesses.id))
        .leftJoin(categories, eq(services.categoryId, categories.id))
        .where(where),
      this.db.db
        .select({ service: services, business: businesses, category: categories })
        .from(services)
        .innerJoin(businesses, eq(services.businessId, businesses.id))
        .leftJoin(categories, eq(services.categoryId, categories.id))
        .where(where)
        .orderBy(orderBy)
        .limit(perPage)
        .offset(offset),
    ]);

    return { rows, total: Number(countResult[0].count) };
  }

  async findAllByBusinessUserId(query: ServiceListQueryDto, userId: string): Promise<{ rows: any[]; total: number }> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 12;
    const offset = (page - 1) * perPage;

    const conditions: any[] = [eq(services.isActive, true)];

    const businessUser = await this.db.db.select()
      .from(businesses)
      .where(
        and(
          eq(businesses.ownerId, userId),
          eq(businesses.status, 'active')
        )
      ).limit(1);
      console.log(businessUser);
    conditions.push(eq(services.businessId, businessUser[0].id))
    if (query.q) {
      conditions.push(
        or(
          ilike(services.name, `%${query.q}%`),
          ilike(businesses.name, `%${query.q}%`),
        ),
      );
    }
    if (query.categoryId) {
      conditions.push(eq(services.categoryId, query.categoryId));
    }

    const where = and(...conditions);

    const orderBy = (() => {
      switch (query.sort) {
        case 'price_asc':    return asc(services.priceCents);
        case 'price_desc':   return desc(services.priceCents);
        case 'duration_asc': return asc(services.durationMinutes);
        default:             return asc(services.createdAt);
      }
    })();

    const [countResult, rows] = await Promise.all([
      this.db.db
        .select({ count: count() })
        .from(services)
        .innerJoin(businesses, eq(services.businessId, businesses.id))
        .leftJoin(categories, eq(services.categoryId, categories.id))
        .where(where),
      this.db.db
        .select({ service: services, business: businesses, category: categories })
        .from(services)
        .innerJoin(businesses, eq(services.businessId, businesses.id))
        .leftJoin(categories, eq(services.categoryId, categories.id))
        .where(where)
        .orderBy(orderBy)
        .limit(perPage)
        .offset(offset),
    ]);

    return { rows, total: Number(countResult[0].count) };
  }

  async findWithRelations(id: string): Promise<any | null> {
    const rows = await this.db.db
      .select({ service: services, business: businesses, category: categories })
      .from(services)
      .innerJoin(businesses, eq(services.businessId, businesses.id))
      .leftJoin(categories, eq(services.categoryId, categories.id))
      .where(eq(services.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<SelectService | null> {
    const rows = await this.db.db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findBusinessById(id: string): Promise<SelectBusiness | null> {
    const rows = await this.db.db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findBusinessByOwnerId(ownerId: string): Promise<SelectBusiness | null> {
    const rows = await this.db.db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, ownerId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findBusinessBySlug(slug: string): Promise<SelectBusiness | null> {
    const rows = await this.db.db
      .select()
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<SelectBusiness | null> {
    const [row] = await this.db.db
      .update(businesses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return row ?? null;
  }

  async create(data: Omit<InsertService, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectService> {
    const [row] = await this.db.db.insert(services).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<InsertService>) {
    const [row] = await this.db.db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    const result = await this.db.db.select({
      service: services,
      business: businesses,
      category: categories
    }).from(services)
    .innerJoin(businesses, eq(services.businessId,businesses.id))
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .where(eq(services.id, id)).limit(1);
    return result[0];
  }

  async findRulesByDayOfWeek(serviceId: string, dayOfWeek: string): Promise<SelectAvailabilityRule[]> {
    return this.db.db
      .select()
      .from(availabilityRules)
      .where(
        and(
          eq(availabilityRules.serviceId, serviceId),
          eq(availabilityRules.dayOfWeek, dayOfWeek),
          eq(availabilityRules.isActive, true),
        ),
      );
  }

  async findBlocksByDate(serviceId: string, date: string): Promise<SelectAvailabilityBlock[]> {
    return this.db.db
      .select()
      .from(availabilityBlocks)
      .where(
        and(
          eq(availabilityBlocks.serviceId, serviceId),
          eq(availabilityBlocks.blockDate, date),
        ),
      );
  }

  async findBookedSlots(serviceId: string, _date: string): Promise<{ bookingTime: string; count: number }[]> {
    // TODO: implement when BookingsModule adds the bookings table
    // Query: SELECT booking_time, COUNT(*) as count FROM bookings
    //        WHERE service_id = serviceId AND booking_date = date
    //        AND status IN ('pending', 'confirmed') GROUP BY booking_time
    void serviceId;
    return [];
  }

  // ── Availability rules ──────────────────────────────────────────────────────

  async findAllRules(serviceId: string): Promise<SelectAvailabilityRule[]> {
    return this.db.db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.serviceId, serviceId))
      .orderBy(asc(availabilityRules.dayOfWeek));
  }

  async findRuleById(ruleId: string): Promise<SelectAvailabilityRule | null> {
    const rows = await this.db.db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.id, ruleId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createRule(data: Omit<InsertAvailabilityRule, 'id'>): Promise<SelectAvailabilityRule> {
    const [row] = await this.db.db.insert(availabilityRules).values(data).returning();
    return row;
  }

  async updateRule(ruleId: string, data: Partial<InsertAvailabilityRule>): Promise<SelectAvailabilityRule | null> {
    const [row] = await this.db.db
      .update(availabilityRules)
      .set(data)
      .where(eq(availabilityRules.id, ruleId))
      .returning();
    return row ?? null;
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.db.db.delete(availabilityRules).where(eq(availabilityRules.id, ruleId));
  }

  // ── Availability blocks ─────────────────────────────────────────────────────

  async findAllBlocks(serviceId: string): Promise<SelectAvailabilityBlock[]> {
    return this.db.db
      .select()
      .from(availabilityBlocks)
      .where(eq(availabilityBlocks.serviceId, serviceId))
      .orderBy(asc(availabilityBlocks.blockDate));
  }

  async findBlockById(blockId: string): Promise<SelectAvailabilityBlock | null> {
    const rows = await this.db.db
      .select()
      .from(availabilityBlocks)
      .where(eq(availabilityBlocks.id, blockId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createBlock(data: Omit<InsertAvailabilityBlock, 'id' | 'createdAt'>): Promise<SelectAvailabilityBlock> {
    const [row] = await this.db.db.insert(availabilityBlocks).values(data).returning();
    return row;
  }

  async updateBlock(blockId: string, data: Partial<InsertAvailabilityBlock>): Promise<SelectAvailabilityBlock | null> {
    const [row] = await this.db.db
      .update(availabilityBlocks)
      .set(data)
      .where(eq(availabilityBlocks.id, blockId))
      .returning();
    return row ?? null;
  }

  async deleteBlock(blockId: string): Promise<void> {
    await this.db.db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, blockId));
  }
}
