import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: {
        id: string;
    }): Promise<UserResponseDto>;
    updateMe(user: {
        id: string;
    }, dto: UpdateProfileDto): Promise<UserResponseDto>;
    deleteMe(user: {
        id: string;
    }): Promise<{
        message: string;
    }>;
}
