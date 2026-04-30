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
exports.FileResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
let FileResponseDto = class FileResponseDto {
    constructor(partial) {
        Object.assign(this, partial);
    }
};
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-v4' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], FileResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'profile-photo.jpg' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], FileResponseDto.prototype, "originalName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'image/jpeg' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], FileResponseDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 204800, description: 'File size in bytes' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], FileResponseDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], FileResponseDto.prototype, "createdAt", void 0);
FileResponseDto = __decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:paramtypes", [Object])
], FileResponseDto);
exports.FileResponseDto = FileResponseDto;
//# sourceMappingURL=file-response.dto.js.map