/// <reference types="multer" />
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SelectFile } from '../database/schema';
import { FilesRepository } from './files.repository';
import { SupabaseStorageService } from './supabase.service';
export declare class FilesService implements OnModuleInit {
    private readonly filesRepository;
    private readonly storageService;
    private readonly configService;
    private defaultBucket;
    constructor(filesRepository: FilesRepository, storageService: SupabaseStorageService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    uploadFile(file: Express.Multer.File, uploadedBy: string | null, subfolder?: string): Promise<SelectFile>;
    getFileUrl(fileId: string): Promise<string>;
    getFileUrls(fileIds: string[]): Promise<Record<string, string>>;
    deleteFile(fileId: string): Promise<void>;
}
