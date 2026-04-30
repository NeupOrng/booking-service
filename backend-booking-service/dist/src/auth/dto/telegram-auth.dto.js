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
exports.TelegramAuthDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class TelegramAuthDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Telegram user ID', example: 123456789 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TelegramAuthDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Alice' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelegramAuthDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Smith' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelegramAuthDto.prototype, "last_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'alice_tg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelegramAuthDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Telegram profile photo URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelegramAuthDto.prototype, "photo_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unix timestamp of auth (must be < 24h old)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TelegramAuthDto.prototype, "auth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HMAC-SHA256 signature from Telegram' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelegramAuthDto.prototype, "hash", void 0);
exports.TelegramAuthDto = TelegramAuthDto;
//# sourceMappingURL=telegram-auth.dto.js.map