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
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let MinioService = class MinioService {
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.config = this.configService.get('storage');
        this.client = new client_s3_1.S3Client({
            endpoint: this.config.endpoint,
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKey,
                secretAccessKey: this.config.secretKey,
            },
            forcePathStyle: true,
        });
    }
    async upload(bucket, objectKey, body, contentType) {
        try {
            await this.client.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: contentType }));
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(`Failed to upload object: ${err.message}`);
        }
    }
    async getPresignedUrl(bucket, objectKey, expiresInSeconds) {
        const expiry = expiresInSeconds !== null && expiresInSeconds !== void 0 ? expiresInSeconds : this.config.presignExpirySeconds;
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: expiry });
    }
    async delete(bucket, objectKey) {
        try {
            await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(`Failed to delete object: ${err.message}`);
        }
    }
    async ensureBucket(bucket) {
        var _a;
        try {
            await this.client.send(new client_s3_1.HeadBucketCommand({ Bucket: bucket }));
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.name) === 'NoSuchBucket' || ((_a = err === null || err === void 0 ? void 0 : err.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) === 404) {
                await this.client.send(new client_s3_1.CreateBucketCommand({ Bucket: bucket }));
            }
        }
    }
};
MinioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MinioService);
exports.MinioService = MinioService;
//# sourceMappingURL=minio.service.js.map