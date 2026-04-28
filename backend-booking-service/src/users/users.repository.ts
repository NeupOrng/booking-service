import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  users,
  oauthAccounts,
  SelectUser,
  InsertUser,
  SelectOauthAccount,
  InsertOauthAccount,
} from '../database/schema';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<SelectUser | null> {
    const rows = await this.db.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<SelectUser | null> {
    const rows = await this.db.db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async create(data: Partial<InsertUser>): Promise<SelectUser> {
    const [user] = await this.db.db.insert(users).values(data as InsertUser).returning();
    return user;
  }

  async update(id: string, data: Partial<InsertUser>): Promise<SelectUser | null> {
    const [user] = await this.db.db.update(users).set(data).where(eq(users.id, id)).returning();
    return user ?? null;
  }

  async findOAuthAccount(provider: string, providerUserId: string): Promise<SelectOauthAccount | null> {
    const rows = await this.db.db
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerUserId, providerUserId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async createOAuthAccount(data: Partial<InsertOauthAccount>): Promise<SelectOauthAccount> {
    const [account] = await this.db.db.insert(oauthAccounts).values(data as InsertOauthAccount).returning();
    return account;
  }

  async createUserWithOAuth(
    userData: Partial<InsertUser>,
    oauthData: Omit<Partial<InsertOauthAccount>, 'userId'>,
  ): Promise<SelectUser> {
    return this.db.db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values(userData as InsertUser).returning();
      await tx.insert(oauthAccounts).values({ ...(oauthData as InsertOauthAccount), userId: user.id });
      return user;
    });
  }
}
