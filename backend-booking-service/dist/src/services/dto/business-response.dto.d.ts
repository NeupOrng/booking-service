export declare class BusinessResponseDto {
    id: string;
    ownerId: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    logoUrl: string | null;
    phone: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<BusinessResponseDto>);
}
