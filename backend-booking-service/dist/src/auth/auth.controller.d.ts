import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterBusinessOwnerDto } from './dto/register-business-owner.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    } & {
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string;
            role: string;
            isActive: boolean;
            isEmailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    } & {
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string;
            role: string;
            isActive: boolean;
            isEmailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: {
        id: string;
    }): Promise<{
        message: string;
    }>;
    registerAdmin(dto: RegisterAdminDto): Promise<{
        accessToken: string;
        refreshToken: string;
    } & {
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string;
            role: string;
            isActive: boolean;
            isEmailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    registerBusinessOwner(dto: RegisterBusinessOwnerDto): Promise<{
        accessToken: string;
        refreshToken: string;
    } & {
        user: {
            id: string;
            email: string;
            fullName: string;
            avatarUrl: string;
            role: string;
            isActive: boolean;
            isEmailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        business: {
            description: string;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
            slug: string;
            address: string;
            logoUrl: string;
            phone: string;
            status: string;
        };
    }>;
}
