import { DatabaseService } from '../database/database.service';
import { InsertAvailabilityBlock, InsertAvailabilityRule, InsertBusiness, InsertService, SelectAvailabilityBlock, SelectAvailabilityRule, SelectBusiness, SelectCategory, SelectService } from '../database/schema';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
export declare class ServicesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(query: ServiceListQueryDto): Promise<{
        rows: any[];
        total: number;
    }>;
    findAllByBusinessUserId(query: ServiceListQueryDto, userId: string): Promise<{
        rows: any[];
        total: number;
    }>;
    findWithRelations(id: string): Promise<any | null>;
    findById(id: string): Promise<SelectService | null>;
    findBusinessById(id: string): Promise<SelectBusiness | null>;
    findBusinessByOwnerId(ownerId: string): Promise<SelectBusiness | null>;
    findBusinessBySlug(slug: string): Promise<SelectBusiness | null>;
    updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<SelectBusiness | null>;
    create(data: Omit<InsertService, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
        service: SelectService;
        business: SelectBusiness;
        category: SelectCategory;
    }>;
    update(id: string, data: Partial<InsertService>): Promise<{
        service: {
            id: string;
            businessId: string;
            categoryId: string;
            name: string;
            description: string;
            priceCents: number;
            durationMinutes: number;
            coverImageUrl: string;
            cancellationPolicy: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        business: {
            id: string;
            ownerId: string;
            name: string;
            slug: string;
            description: string;
            address: string;
            logoUrl: string;
            phone: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        category: {
            id: string;
            name: string;
            slug: string;
            description: string;
            colorHex: string;
            sortOrder: number;
            createdAt: Date;
        };
    }>;
    findRulesByDayOfWeek(serviceId: string, dayOfWeek: string): Promise<SelectAvailabilityRule[]>;
    findBlocksByDate(serviceId: string, date: string): Promise<SelectAvailabilityBlock[]>;
    findBookedSlots(serviceId: string, date: string): Promise<{
        bookingTime: string;
        count: number;
    }[]>;
    findAllRules(serviceId: string): Promise<SelectAvailabilityRule[]>;
    findRuleById(ruleId: string): Promise<SelectAvailabilityRule | null>;
    createRule(data: Omit<InsertAvailabilityRule, 'id'>): Promise<SelectAvailabilityRule>;
    updateRule(ruleId: string, data: Partial<InsertAvailabilityRule>): Promise<SelectAvailabilityRule | null>;
    deleteRule(ruleId: string): Promise<void>;
    findAllBlocks(serviceId: string): Promise<SelectAvailabilityBlock[]>;
    findBlockById(blockId: string): Promise<SelectAvailabilityBlock | null>;
    createBlock(data: Omit<InsertAvailabilityBlock, 'id' | 'createdAt'>): Promise<SelectAvailabilityBlock>;
    updateBlock(blockId: string, data: Partial<InsertAvailabilityBlock>): Promise<SelectAvailabilityBlock | null>;
    deleteBlock(blockId: string): Promise<void>;
}
