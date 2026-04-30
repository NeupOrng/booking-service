import { ServicesService } from './services.service';
import { BusinessResponseDto } from './dto/business-response.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
export declare class BusinessesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    getMyBusiness(user: {
        id: string;
        role: string;
    }): Promise<BusinessResponseDto>;
    updateBusiness(id: string, dto: UpdateBusinessDto, user: {
        id: string;
        role: string;
    }): Promise<BusinessResponseDto>;
}
