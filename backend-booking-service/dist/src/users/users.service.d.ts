import { SelectUser, UserRole } from '../database/schema';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    findById(id: string): Promise<SelectUser | null>;
    findByEmail(email: string): Promise<SelectUser | null>;
    create(data: {
        email?: string;
        passwordHash?: string;
        fullName: string;
        avatarUrl?: string;
        role?: UserRole;
        isEmailVerified?: boolean;
    }): Promise<SelectUser>;
    updateProfile(id: string, dto: UpdateProfileDto): Promise<SelectUser>;
    deactivate(id: string): Promise<void>;
    findOrCreateOAuth(provider: 'google' | 'telegram', providerUserId: string, profile: {
        email?: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<SelectUser>;
}
