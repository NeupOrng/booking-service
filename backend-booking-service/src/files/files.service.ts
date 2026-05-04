import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { SelectFile } from '../database/schema';
import { FilesRepository } from './files.repository';
import { SupabaseStorageService } from './supabase.service';

@Injectable()
export class FilesService implements OnModuleInit {
    private defaultBucket: string;

    constructor(
        private readonly filesRepository: FilesRepository,
        private readonly storageService: SupabaseStorageService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        this.defaultBucket = this.configService.get<string>('storage.bucket');
        await this.storageService.ensureBucket(this.defaultBucket);
    }

    async uploadFile(
        file: Express.Multer.File,
        uploadedBy: string | null,
        subfolder?: string,
    ): Promise<SelectFile> {
        const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
        const objectKey = `${
            subfolder ?? 'uploads'
        }/${Date.now()}-${uuidv4()}-${safeName}`;

        await this.storageService.upload(
            this.defaultBucket,
            objectKey,
            file.buffer,
            file.mimetype,
        );

        return this.filesRepository.create({
            bucket: this.defaultBucket,
            objectKey,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            uploadedBy: uploadedBy ?? undefined,
        });
    }

    async getFileUrl(fileId: string): Promise<string> {
        const file = await this.filesRepository.findById(fileId);
        if (!file) throw new NotFoundException('File not found');
        return this.storageService.getPresignedUrl(file.bucket, file.objectKey);
    }

    async getFileUrls(fileIds: string[]): Promise<Record<string, string>> {
        const records = await this.filesRepository.findByIds(fileIds);
        const entries = await Promise.all(
            records.map(async (file) => {
                const url = await this.storageService.getPresignedUrl(
                    file.bucket,
                    file.objectKey,
                );
                return [file.id, url] as [string, string];
            }),
        );
        return Object.fromEntries(entries);
    }

    async deleteFile(fileId: string): Promise<void> {
        const file = await this.filesRepository.findById(fileId);
        if (!file) throw new NotFoundException('File not found');
        await this.storageService.delete(file.bucket, file.objectKey);
        await this.filesRepository.delete(fileId);
    }
}
