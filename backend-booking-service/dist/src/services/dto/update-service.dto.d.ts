import { CreateServiceDto } from './create-service.dto';
declare const UpdateServiceDto_base: import("@nestjs/common").Type<Partial<Omit<CreateServiceDto, "businessId">>>;
export declare class UpdateServiceDto extends UpdateServiceDto_base {
}
export {};
