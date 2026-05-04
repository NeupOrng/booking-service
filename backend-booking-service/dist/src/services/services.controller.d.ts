import { ServicesService } from './services.service';
import { ServiceListQueryDto } from './dto/service-list-query.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { UpdateAvailabilityBlockDto } from './dto/update-availability-block.dto';
declare class AvailabilityQueryDto {
    date: string;
}
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    findAll(query: ServiceListQueryDto): Promise<{
        data: {
            id: any;
            name: any;
            priceCents: any;
            durationMinutes: any;
            coverImageUrl: any;
            cancellationPolicy: any;
            isActive: any;
            description: any;
            business: {
                id: any;
                name: any;
                logoUrl: any;
            };
            category: {
                id: any;
                name: any;
                slug: any;
                colorHex: any;
            };
            nextAvailableSlot: any;
        }[];
        meta: any;
    }>;
    findAllBusinessService(query: ServiceListQueryDto, user: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            perPage: number;
            lastPage: number;
        };
    }>;
    findById(id: string): Promise<{
        id: any;
        name: any;
        description: any;
        priceCents: any;
        durationMinutes: any;
        coverImageUrl: any;
        cancellationPolicy: any;
        isActive: any;
        business: {
            id: any;
            name: any;
            logoUrl: any;
            address: any;
            phone: any;
        };
        category: {
            id: any;
            name: any;
            slug: any;
            colorHex: any;
        };
        nextAvailableSlot: any;
    }>;
    getAvailability(id: string, query: AvailabilityQueryDto): Promise<{
        date: string;
        slots: (import("./availability.service").SlotResult & {
            available: boolean;
        })[];
    }>;
    create(dto: CreateServiceDto, user: {
        id: string;
        role: string;
    }): Promise<{
        id: any;
        name: any;
        description: any;
        priceCents: any;
        durationMinutes: any;
        coverImageUrl: any;
        cancellationPolicy: any;
        isActive: any;
        business: {
            id: any;
            name: any;
            logoUrl: any;
            address: any;
            phone: any;
        };
        category: {
            id: any;
            name: any;
            slug: any;
            colorHex: any;
        };
        nextAvailableSlot: any;
    }>;
    update(id: string, dto: UpdateServiceDto, user: {
        id: string;
        role: string;
    }): Promise<{
        id: any;
        name: any;
        description: any;
        priceCents: any;
        durationMinutes: any;
        coverImageUrl: any;
        cancellationPolicy: any;
        isActive: any;
        business: {
            id: any;
            name: any;
            logoUrl: any;
            address: any;
            phone: any;
        };
        category: {
            id: any;
            name: any;
            slug: any;
            colorHex: any;
        };
        nextAvailableSlot: any;
    }>;
    listRules(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        serviceId: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        slotDurationMinutes: number;
        capacity: number;
    }[]>;
    createRule(id: string, dto: CreateAvailabilityRuleDto, user: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        serviceId: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        slotDurationMinutes: number;
        capacity: number;
    }>;
    updateRule(id: string, ruleId: string, dto: UpdateAvailabilityRuleDto, user: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        serviceId: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        slotDurationMinutes: number;
        capacity: number;
    }>;
    deleteRule(id: string, ruleId: string, user: {
        id: string;
        role: string;
    }): Promise<void>;
    listBlocks(id: string, user: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        serviceId: string;
        reason: string;
        startTime: string;
        endTime: string;
        blockDate: string;
    }[]>;
    createBlock(id: string, dto: CreateAvailabilityBlockDto, user: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        serviceId: string;
        reason: string;
        startTime: string;
        endTime: string;
        blockDate: string;
    }>;
    updateBlock(id: string, blockId: string, dto: UpdateAvailabilityBlockDto, user: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        serviceId: string;
        reason: string;
        startTime: string;
        endTime: string;
        blockDate: string;
    }>;
    deleteBlock(id: string, blockId: string, user: {
        id: string;
        role: string;
    }): Promise<void>;
}
export {};
