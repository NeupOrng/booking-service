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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const files_service_1 = require("./files.service");
const file_response_dto_1 = require("./dto/file-response.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let FilesController = class FilesController {
    constructor(filesService) {
        this.filesService = filesService;
    }
    async upload(file, user, subfolder) {
        const record = await this.filesService.uploadFile(file, user.id, subfolder);
        return new file_response_dto_1.FileResponseDto(record);
    }
    async getUrl(id) {
        const url = await this.filesService.getFileUrl(id);
        return { url };
    }
    async remove(id) {
        await this.filesService.deleteFile(id);
        return { message: 'File deleted' };
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Upload a file to object storage' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, swagger_1.ApiQuery)({ name: 'subfolder', required: false, example: 'bookings' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: file_response_dto_1.FileResponseDto }),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('subfolder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "upload", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Get a presigned download URL for a file (1-hour expiry)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'File UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, schema: { example: { url: 'https://...' } } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File not found' }),
    (0, common_1.Get)(':id/url'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getUrl", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a file from storage and database' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'File UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: { example: { message: 'File deleted' } },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File not found' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "remove", null);
FilesController = __decorate([
    (0, swagger_1.ApiTags)('files'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
exports.FilesController = FilesController;
//# sourceMappingURL=files.controller.js.map