/// <reference types="node" />
/// <reference types="node" />
import { ConfigService } from '@nestjs/config';
export declare class SupabaseStorageService {
    private readonly configService;
    private readonly client;
    private readonly defaultPresignExpiry;
    constructor(configService: ConfigService);
    upload(bucket: string, objectKey: string, body: Buffer, contentType: string): Promise<void>;
    getPresignedUrl(bucket: string, objectKey: string, expiresInSeconds?: number): Promise<string>;
    delete(bucket: string, objectKey: string): Promise<void>;
    ensureBucket(bucket: string): Promise<void>;
}
