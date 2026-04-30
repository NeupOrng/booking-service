"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const files_repository_1 = require("./files.repository");
const supabase_service_1 = require("./supabase.service");
let FilesService = class FilesService {
    constructor(filesRepository, storageService, configService) {
        this.filesRepository = filesRepository;
        this.storageService = storageService;
        this.configService = configService;
    }
    async onModuleInit() {
        this.defaultBucket = this.configService.get('storage.bucket');
        await this.storageService.ensureBucket(this.defaultBucket);
    }
    async uploadFile(file, uploadedBy, subfolder) {
        const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
        const objectKey = `${subfolder !== null && subfolder !== void 0 ? subfolder : 'uploads'}/${Date.now()}-${(0, uuid_1.v4)()}-${safeName}`;
        await this.storageService.upload(this.defaultBucket, objectKey, file.buffer, file.mimetype);
        return this.filesRepository.create({
            bucket: this.defaultBucket,
            objectKey,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            uploadedBy: uploadedBy !== null && uploadedBy !== void 0 ? uploadedBy : undefined,
        });
    }
    async getFileUrl(fileId) {
        const file = await this.filesRepository.findById(fileId);
        if (!file)
            throw new common_1.NotFoundException('File not found');
        return this.storageService.getPresignedUrl(file.bucket, file.objectKey);
    }
    async getFileUrls(fileIds) {
        const records = await this.filesRepository.findByIds(fileIds);
        const entries = await Promise.all(records.map(async (file) => {
            const url = await this.storageService.getPresignedUrl(file.bucket, file.objectKey);
            return [file.id, url];
        }));
        return Object.fromEntries(entries);
    }
    async deleteFile(fileId) {
        const file = await this.filesRepository.findById(fileId);
        if (!file)
            throw new common_1.NotFoundException('File not found');
        await this.storageService.delete(file.bucket, file.objectKey);
        await this.filesRepository.delete(fileId);
    }
};
FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [files_repository_1.FilesRepository,
        supabase_service_1.SupabaseStorageService,
        config_1.ConfigService])
], FilesService);
exports.FilesService = FilesService;
//# sourceMappingURL=files.service.js.map