import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
    SelectAvailabilityBlock,
    SelectAvailabilityRule,
    SelectBusiness,
    SelectCategory,
    SelectService,
} from '../database/schema';
import { SlotResult } from './availability.service';
import { CategoriesService } from '../categories/categories.service';
import { AvailabilityService } from './availability.service';
import { ServicesRepository } from './services.repository';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { UpdateAvailabilityBlockDto } from './dto/update-availability-block.dto';

function getDayOfWeek(date: string): string {
    return new Date(date)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
}

function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

@Injectable()
export class ServicesService {
    constructor(
        private readonly servicesRepository: ServicesRepository,
        private readonly availabilityService: AvailabilityService,
        private readonly categoriesService: CategoriesService,
        private readonly redisService: RedisService,
    ) { }

    // ── Public read ─────────────────────────────────────────────────────────────

    async findAll(
        query: ServiceListQueryDto,
    ): Promise<{ data: any[]; meta: any }> {
        const result = await this.servicesRepository.findAll(query);
        return this.formatServiceResponse(result, query);
    }

    async findAllByBusinessUser(query: ServiceListQueryDto, userId: string) {
        // Assuming the repository needs the userId to filter by business user
        const result = await this.servicesRepository.findAllByBusinessUserId(query, userId);
        return this.formatServiceResponse(result, query);
    }

    async findById(id: string): Promise<any | null> {
        const row = await this.servicesRepository.findWithRelations(id);
        if (!row || !row.service.isActive) return null;
        return row;
    }

    async getAvailability(
        serviceId: string,
        date: string,
    ): Promise<(SlotResult & { available: boolean })[]> {
        const row = await this.servicesRepository.findWithRelations(serviceId);
        if (!row || !row.service.isActive)
            throw new NotFoundException('Service not found');

        const dayOfWeek = getDayOfWeek(date);

        const [rules, blocks, bookedCounts] = await Promise.all([
            this.servicesRepository.findRulesByDayOfWeek(serviceId, dayOfWeek),
            this.servicesRepository.findBlocksByDate(serviceId, date),
            this.servicesRepository.findBookedSlots(serviceId, date),
        ]);

        const slots = this.availabilityService.computeSlots(
            rules,
            blocks,
            bookedCounts,
        );

        return Promise.all(
            slots.map(async (slot) => {
                try {
                    // One Redis key per active checkout lock: slot_lock:{serviceId}:{date}:{HH:mm}:{lockId}
                    // KEYS is O(N) — acceptable at dev scale; replace with SCAN in production
                    const lockKeys = await this.redisService.client.keys(
                        `slot_lock:${serviceId}:${date}:${slot.time}:*`,
                    );
                    const lockCount = lockKeys.length;
                    const remaining = Math.max(
                        0,
                        slot.remainingCapacity - lockCount,
                    );
                    return {
                        ...slot,
                        remainingCapacity: remaining,
                        available: remaining > 0,
                    };
                } catch {
                    return { ...slot, available: slot.remainingCapacity > 0 };
                }
            }),
        );
    }

    async getNextAvailableSlot(serviceId: string): Promise<string | null> {
        const today = new Date();

        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const date = d.toISOString().substring(0, 10);

            const slots = await this.getAvailability(serviceId, date).catch(
                () => [],
            );
            const first = slots.find((s) => s.available);
            if (first) return `${date}T${first.time}:00.000Z`;
        }

        return null;
    }

    // ── Business management ─────────────────────────────────────────────────────

    async findBusinessByOwner(ownerId: string): Promise<SelectBusiness | null> {
        return this.servicesRepository.findBusinessByOwnerId(ownerId);
    }

    async updateBusiness(
        id: string,
        dto: UpdateBusinessDto,
        userId: string,
        userRole: string,
    ): Promise<SelectBusiness> {
        const business = await this.servicesRepository.findBusinessById(id);
        if (!business) throw new NotFoundException('Business not found');

        if (userRole !== 'admin' && business.ownerId !== userId) {
            throw new ForbiddenException('You do not own this business');
        }

        if (dto.slug && dto.slug !== business.slug) {
            const conflict = await this.servicesRepository.findBusinessBySlug(
                dto.slug,
            );
            if (conflict)
                throw new ConflictException('Business slug already in use');
        }

        const updated = await this.servicesRepository.updateBusiness(id, dto);
        if (!updated) throw new NotFoundException('Business not found');
        return updated;
    }

    // ── Service write ───────────────────────────────────────────────────────────

    async createService(
        dto: CreateServiceDto,
        userId: string,
        userRole: string,
    ): Promise<{ service: SelectService, business: SelectBusiness, category: SelectCategory }> {
        if (userRole !== 'admin') {
            const business = await this.servicesRepository.findBusinessById(
                dto.businessId,
            );
            if (!business) throw new NotFoundException('Business not found');
            if (business.ownerId !== userId)
                throw new ForbiddenException('You do not own this business');
        }

        if (dto.categoryId) {
            const category = await this.categoriesService.findById(
                dto.categoryId,
            );
            if (!category) throw new NotFoundException('Category not found');
        }

        return this.servicesRepository.create({
            businessId: dto.businessId,
            categoryId: dto.categoryId ?? null,
            name: dto.name,
            description: dto.description,
            priceCents: dto.priceCents,
            durationMinutes: dto.durationMinutes,
            coverImageUrl: dto.coverImageUrl,
            cancellationPolicy: dto.cancellationPolicy,
            isActive: dto.isActive ?? true,
        });
    }

    async updateService(
        id: string,
        dto: UpdateServiceDto,
        userId: string,
        userRole: string,
    ) {
        await this.assertServiceOwnership(id, userId, userRole);

        if (dto.categoryId) {
            const category = await this.categoriesService.findById(
                dto.categoryId,
            );
            if (!category) throw new NotFoundException('Category not found');
        }

        const updated = await this.servicesRepository.update(id, dto);
        if (!updated) throw new NotFoundException('Service not found');
        return updated;
    }

    // ── Shared ownership guard ──────────────────────────────────────────────────

    private async assertServiceOwnership(
        serviceId: string,
        userId: string,
        userRole: string,
    ): Promise<void> {
        const service = await this.servicesRepository.findById(serviceId);
        if (!service) throw new NotFoundException('Service not found');
        if (userRole === 'admin') return;

        const business = await this.servicesRepository.findBusinessById(
            service.businessId,
        );
        if (!business || business.ownerId !== userId) {
            throw new ForbiddenException('You do not own this service');
        }
    }

    // ── Availability rules ──────────────────────────────────────────────────────

    async listRules(
        serviceId: string,
        userId: string,
        userRole: string,
    ): Promise<SelectAvailabilityRule[]> {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        return this.servicesRepository.findAllRules(serviceId);
    }

    async createRule(
        serviceId: string,
        dto: CreateAvailabilityRuleDto,
        userId: string,
        userRole: string,
    ): Promise<SelectAvailabilityRule> {
        await this.assertServiceOwnership(serviceId, userId, userRole);

        const startMinutes = parseTimeToMinutes(dto.startTime);
        const endMinutes = parseTimeToMinutes(dto.endTime);
        if (startMinutes >= endMinutes) {
            throw new BadRequestException('startTime must be before endTime');
        }
        const windowMinutes = endMinutes - startMinutes;
        if (windowMinutes % dto.slotDurationMinutes !== 0) {
            throw new BadRequestException(
                `${dto.slotDurationMinutes}-min slots do not divide evenly into a ${windowMinutes}-min window`,
            );
        }

        return this.servicesRepository.createRule({
            serviceId,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            slotDurationMinutes: dto.slotDurationMinutes,
            capacity: dto.capacity ?? 1,
            isActive: dto.isActive ?? true,
        });
    }

    async updateRule(
        serviceId: string,
        ruleId: string,
        dto: UpdateAvailabilityRuleDto,
        userId: string,
        userRole: string,
    ): Promise<SelectAvailabilityRule> {
        await this.assertServiceOwnership(serviceId, userId, userRole);

        const existing = await this.servicesRepository.findRuleById(ruleId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new NotFoundException('Availability rule not found');
        }

        // Validate times using merged values (dto fields override existing)
        if (dto.startTime || dto.endTime || dto.slotDurationMinutes) {
            const startTime = dto.startTime ?? existing.startTime;
            const endTime = dto.endTime ?? existing.endTime;
            const slotDurationMinutes =
                dto.slotDurationMinutes ?? existing.slotDurationMinutes;
            const startMinutes = parseTimeToMinutes(startTime);
            const endMinutes = parseTimeToMinutes(endTime);

            if (startMinutes >= endMinutes) {
                throw new BadRequestException(
                    'startTime must be before endTime',
                );
            }
            const windowMinutes = endMinutes - startMinutes;
            if (windowMinutes % slotDurationMinutes !== 0) {
                throw new BadRequestException(
                    `${slotDurationMinutes}-min slots do not divide evenly into a ${windowMinutes}-min window`,
                );
            }
        }

        return this.servicesRepository.updateRule(ruleId, dto);
    }

    async deleteRule(
        serviceId: string,
        ruleId: string,
        userId: string,
        userRole: string,
    ): Promise<void> {
        await this.assertServiceOwnership(serviceId, userId, userRole);

        const existing = await this.servicesRepository.findRuleById(ruleId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new NotFoundException('Availability rule not found');
        }

        await this.servicesRepository.deleteRule(ruleId);
    }

    // ── Availability blocks ─────────────────────────────────────────────────────

    async listBlocks(
        serviceId: string,
        userId: string,
        userRole: string,
    ): Promise<SelectAvailabilityBlock[]> {
        await this.assertServiceOwnership(serviceId, userId, userRole);
        return this.servicesRepository.findAllBlocks(serviceId);
    }

    async createBlock(
        serviceId: string,
        dto: CreateAvailabilityBlockDto,
        userId: string,
        userRole: string,
    ): Promise<SelectAvailabilityBlock> {
        await this.assertServiceOwnership(serviceId, userId, userRole);

        if (
            (dto.startTime && !dto.endTime) ||
            (!dto.startTime && dto.endTime)
        ) {
            throw new BadRequestException(
                'Provide both startTime and endTime, or neither for a whole-day block',
            );
        }
        if (dto.startTime && dto.endTime) {
            if (
                parseTimeToMinutes(dto.startTime) >=
                parseTimeToMinutes(dto.endTime)
            ) {
                throw new BadRequestException(
                    'startTime must be before endTime',
                );
            }
        }

        return this.servicesRepository.createBlock({
            serviceId,
            blockDate: dto.blockDate,
            startTime: dto.startTime,
            endTime: dto.endTime,
            reason: dto.reason,
        });
    }

    async updateBlock(
        serviceId: string,
        blockId: string,
        dto: UpdateAvailabilityBlockDto,
        userId: string,
        userRole: string,
    ): Promise<SelectAvailabilityBlock> {
        await this.assertServiceOwnership(serviceId, userId, userRole);

        const existing = await this.servicesRepository.findBlockById(blockId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new NotFoundException('Availability block not found');
        }

        return this.servicesRepository.updateBlock(blockId, dto);
    }

    async deleteBlock(
        serviceId: string,
        blockId: string,
        userId: string,
        userRole: string,
    ): Promise<void> {
        await this.assertServiceOwnership(serviceId, userId, userRole);

        const existing = await this.servicesRepository.findBlockById(blockId);
        if (!existing || existing.serviceId !== serviceId) {
            throw new NotFoundException('Availability block not found');
        }

        await this.servicesRepository.deleteBlock(blockId);
    }

    // ── Private Method ─────────────────────────────────────────────────────

    private async formatServiceResponse(
        result: { rows: any[]; total: number },
        query: ServiceListQueryDto,
    ) {

        Logger.log("row before format", result)
        const { rows, total } = result;
        const page = query.page ?? 1;
        const perPage = query.perPage ?? 12;

        let data: any[];

        if (query.sort === 'soonest') {
            data = await Promise.all(
                rows.map(async (row) => ({
                    service: row.service,
                    business: row.business,
                    category: row.category,
                    nextAvailableSlot: await this.getNextAvailableSlot(
                        row.service.id,
                    ),
                })),
            );

            data.sort((a, b) => {
                if (!a.nextAvailableSlot && !b.nextAvailableSlot) return 0;
                if (!a.nextAvailableSlot) return 1;
                if (!b.nextAvailableSlot) return -1;
                return (
                    new Date(a.nextAvailableSlot).getTime() -
                    new Date(b.nextAvailableSlot).getTime()
                );
            });
        } else {
            data = rows.map((row) => ({
                service: row.service,
                business: row.business,
                category: row.category,
                nextAvailableSlot: null
            }));
        }
        Logger.log("row after format", data)
        return {
            data,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }
}