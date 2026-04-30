import { RedisService } from '../redis/redis.service';
import { SelectAvailabilityBlock, SelectAvailabilityRule, SelectBusiness, SelectCategory, SelectService } from '../database/schema';
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
export declare class ServicesService {
    private readonly servicesRepository;
    private readonly availabilityService;
    private readonly categoriesService;
    private readonly redisService;
    constructor(servicesRepository: ServicesRepository, availabilityService: AvailabilityService, categoriesService: CategoriesService, redisService: RedisService);
    findAll(query: ServiceListQueryDto): Promise<{
        data: any[];
        meta: any;
    }>;
    findAllByBusinessUser(query: ServiceListQueryDto, userId: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            perPage: number;
            lastPage: number;
        };
    }>;
    findById(id: string): Promise<any | null>;
    getAvailability(serviceId: string, date: string): Promise<(SlotResult & {
        available: boolean;
    })[]>;
    getNextAvailableSlot(serviceId: string): Promise<string | null>;
    findBusinessByOwner(ownerId: string): Promise<SelectBusiness | null>;
    updateBusiness(id: string, dto: UpdateBusinessDto, userId: string, userRole: string): Promise<SelectBusiness>;
    createService(dto: CreateServiceDto, userId: string, userRole: string): Promise<{
        service: SelectService;
        business: SelectBusiness;
        category: SelectCategory;
    }>;
    updateService(id: string, dto: UpdateServiceDto, userId: string, userRole: string): Promise<{
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
    private assertServiceOwnership;
    listRules(serviceId: string, userId: string, userRole: string): Promise<SelectAvailabilityRule[]>;
    createRule(serviceId: string, dto: CreateAvailabilityRuleDto, userId: string, userRole: string): Promise<SelectAvailabilityRule>;
    updateRule(serviceId: string, ruleId: string, dto: UpdateAvailabilityRuleDto, userId: string, userRole: string): Promise<SelectAvailabilityRule>;
    deleteRule(serviceId: string, ruleId: string, userId: string, userRole: string): Promise<void>;
    listBlocks(serviceId: string, userId: string, userRole: string): Promise<SelectAvailabilityBlock[]>;
    createBlock(serviceId: string, dto: CreateAvailabilityBlockDto, userId: string, userRole: string): Promise<SelectAvailabilityBlock>;
    updateBlock(serviceId: string, blockId: string, dto: UpdateAvailabilityBlockDto, userId: string, userRole: string): Promise<SelectAvailabilityBlock>;
    deleteBlock(serviceId: string, blockId: string, userId: string, userRole: string): Promise<void>;
    private formatServiceResponse;
}
