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
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseStorageService = class SupabaseStorageService {
    constructor(configService) {
        var _a;
        this.configService = configService;
        const url = this.configService.get('storage.url');
        const key = this.configService.get('storage.serviceRoleKey');
        this.defaultPresignExpiry =
            (_a = this.configService.get('storage.presignExpirySeconds')) !== null && _a !== void 0 ? _a : 3600;
        this.client = (0, supabase_js_1.createClient)(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    async upload(bucket, objectKey, body, contentType) {
        const { error } = await this.client.storage
            .from(bucket)
            .upload(objectKey, body, { contentType, upsert: true });
        if (error)
            throw new common_1.InternalServerErrorException(`Upload failed: ${error.message}`);
    }
    async getPresignedUrl(bucket, objectKey, expiresInSeconds) {
        const expiry = expiresInSeconds !== null && expiresInSeconds !== void 0 ? expiresInSeconds : this.defaultPresignExpiry;
        const { data, error } = await this.client.storage
            .from(bucket)
            .createSignedUrl(objectKey, expiry);
        if (error || !(data === null || data === void 0 ? void 0 : data.signedUrl)) {
            throw new common_1.InternalServerErrorException(`Failed to get signed URL: ${error === null || error === void 0 ? void 0 : error.message}`);
        }
        return data.signedUrl;
    }
    async delete(bucket, objectKey) {
        const { error } = await this.client.storage
            .from(bucket)
            .remove([objectKey]);
        if (error)
            throw new common_1.InternalServerErrorException(`Delete failed: ${error.message}`);
    }
    async ensureBucket(bucket) {
        const { error: getErr } = await this.client.storage.getBucket(bucket);
        if (getErr) {
            const { error: createErr } = await this.client.storage.createBucket(bucket, { public: false });
            if (createErr) {
                throw new common_1.InternalServerErrorException(`Failed to ensure bucket: ${createErr.message}`);
            }
        }
    }
};
SupabaseStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseStorageService);
exports.SupabaseStorageService = SupabaseStorageService;
//# sourceMappingURL=supabase.service.js.map