import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TelegramAuthDto } from '../dto/telegram-auth.dto';

@Injectable()
export class TelegramStrategy {
  constructor(private configService: ConfigService) {}

  verify(dto: TelegramAuthDto): boolean {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    const { hash, ...data } = dto;
    
    // Sort keys alphabetically and join
    const dataCheckString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key as keyof typeof data]}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    
    // Create expected hash
    const expectedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Check hash and timestamp (within 24 hours)
    const isHashValid = hash === expectedHash;
    const isFresh = (Date.now() / 1000) - dto.auth_date < 86400;

    return isHashValid && isFresh;
  }
}
