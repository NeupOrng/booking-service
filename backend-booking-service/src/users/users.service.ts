import { Injectable, NotFoundException } from '@nestjs/common';
import { SelectUser, UserRole } from '../database/schema';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<SelectUser | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<SelectUser | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(data: {
    email?: string;
    passwordHash?: string;
    fullName: string;
    avatarUrl?: string;
    role?: UserRole;
    isEmailVerified?: boolean;
  }): Promise<SelectUser> {
    return this.usersRepository.create(data);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<SelectUser> {
    const updates: Record<string, unknown> = { ...dto, updatedAt: new Date() };

    if (dto.email) {
      const current = await this.usersRepository.findById(id);
      if (current && current.email !== dto.email) {
        updates.isEmailVerified = false;
      }
    }

    const user = await this.usersRepository.update(id, updates);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deactivate(id: string): Promise<void> {
    await this.usersRepository.update(id, { isActive: false, updatedAt: new Date() });
  }

  async findOrCreateOAuth(
    provider: 'google' | 'telegram',
    providerUserId: string,
    profile: { email?: string; fullName: string; avatarUrl?: string },
  ): Promise<SelectUser> {
    const existing = await this.usersRepository.findOAuthAccount(provider, providerUserId);
    if (existing) {
      return this.usersRepository.findById(existing.userId);
    }

    if (profile.email) {
      const userByEmail = await this.usersRepository.findByEmail(profile.email);
      if (userByEmail) {
        await this.usersRepository.createOAuthAccount({
          userId: userByEmail.id,
          provider,
          providerUserId,
        });
        return userByEmail;
      }
    }

    const fallbackEmail = profile.email ?? `${providerUserId}@${provider}.local`;
    return this.usersRepository.createUserWithOAuth(
      {
        email: fallbackEmail,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: 'customer',
        isEmailVerified: provider === 'google',
      },
      { provider, providerUserId },
    );
  }
}
