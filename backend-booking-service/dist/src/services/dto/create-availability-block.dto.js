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
exports.CreateAvailabilityBlockDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
class CreateAvailabilityBlockDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-01', description: 'Date to block in YYYY-MM-DD format' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAvailabilityBlockDto.prototype, "blockDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '12:00',
        description: 'Block start time in HH:mm format. Omit (with endTime) to block the entire day.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' }),
    __metadata("design:type", String)
], CreateAvailabilityBlockDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '14:00', description: 'Block end time (exclusive). Must be provided together with startTime.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' }),
    __metadata("design:type", String)
], CreateAvailabilityBlockDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Public holiday' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAvailabilityBlockDto.prototype, "reason", void 0);
exports.CreateAvailabilityBlockDto = CreateAvailabilityBlockDto;
//# sourceMappingURL=create-availability-block.dto.js.map