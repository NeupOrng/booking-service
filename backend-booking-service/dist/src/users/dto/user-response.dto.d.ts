export declare class UserResponseDto {
    id: string;
    email: string | null;
    fullName: string;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: Date;
    constructor(partial: Partial<UserResponseDto>);
}
