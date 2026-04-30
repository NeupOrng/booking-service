import { DatabaseService } from '../database/database.service';
import { SelectUser, InsertUser, SelectOauthAccount, InsertOauthAccount } from '../database/schema';
export declare class UsersRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<SelectUser | null>;
    findByEmail(email: string): Promise<SelectUser | null>;
    create(data: Partial<InsertUser>): Promise<SelectUser>;
    update(id: string, data: Partial<InsertUser>): Promise<SelectUser | null>;
    findOAuthAccount(provider: string, providerUserId: string): Promise<SelectOauthAccount | null>;
    createOAuthAccount(data: Partial<InsertOauthAccount>): Promise<SelectOauthAccount>;
    createUserWithOAuth(userData: Partial<InsertUser>, oauthData: Omit<Partial<InsertOauthAccount>, 'userId'>): Promise<SelectUser>;
}
