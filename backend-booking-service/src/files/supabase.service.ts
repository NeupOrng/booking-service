import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService implements OnModuleInit {
  private client: SupabaseClient;
  private defaultPresignExpiry: number;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url    = this.configService.get<string>('storage.url');
    const key    = this.configService.get<string>('storage.serviceRoleKey');
    this.defaultPresignExpiry = this.configService.get<number>('storage.presignExpirySeconds') ?? 3600;

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async upload(bucket: string, objectKey: string, body: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from(bucket)
      .upload(objectKey, body, { contentType, upsert: true });
    if (error) throw new InternalServerErrorException(`Upload failed: ${error.message}`);
  }

  async getPresignedUrl(bucket: string, objectKey: string, expiresInSeconds?: number): Promise<string> {
    const expiry = expiresInSeconds ?? this.defaultPresignExpiry;
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(objectKey, expiry);
    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(`Failed to get signed URL: ${error?.message}`);
    }
    return data.signedUrl;
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([objectKey]);
    if (error) throw new InternalServerErrorException(`Delete failed: ${error.message}`);
  }

  async ensureBucket(bucket: string): Promise<void> {
    const { error: getErr } = await this.client.storage.getBucket(bucket);
    if (getErr) {
      const { error: createErr } = await this.client.storage.createBucket(bucket, { public: false });
      if (createErr) {
        throw new InternalServerErrorException(`Failed to ensure bucket: ${createErr.message}`);
      }
    }
  }
}
