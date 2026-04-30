/// <reference types="node" />
/// <reference types="node" />
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MinioService implements OnModuleInit {
    private readonly configService;
    private client;
    private config;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    upload(bucket: string, objectKey: string, body: Buffer, contentType: string): Promise<void>;
    getPresignedUrl(bucket: string, objectKey: string, expiresInSeconds?: number): Promise<string>;
    delete(bucket: string, objectKey: string): Promise<void>;
    ensureBucket(bucket: string): Promise<void>;
}
