export declare class CreateServiceDto {
    businessId: string;
    categoryId?: string;
    name: string;
    description?: string;
    priceCents: number;
    durationMinutes: number;
    coverImageUrl?: string;
    cancellationPolicy?: string;
    isActive?: boolean;
}
