import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(url);
    
    this.client.on('error', (err) => {
      this.logger.error('Redis error', err);
    });
    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
