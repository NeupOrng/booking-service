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
exports.CreateAvailabilityRuleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
class CreateAvailabilityRuleDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: DAYS, example: 'monday' }),
    (0, class_validator_1.IsIn)(DAYS),
    __metadata("design:type", String)
], CreateAvailabilityRuleDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00', description: 'Start time in HH:mm or HH:mm:ss format' }),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: 'startTime must be HH:mm or HH:mm:ss' }),
    __metadata("design:type", String)
], CreateAvailabilityRuleDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '17:00', description: 'End time in HH:mm or HH:mm:ss format (exclusive)' }),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: 'endTime must be HH:mm or HH:mm:ss' }),
    __metadata("design:type", String)
], CreateAvailabilityRuleDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 60, description: 'Slot length in minutes (15–480)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], CreateAvailabilityRuleDto.prototype, "slotDurationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1,
        default: 1,
        description: 'Max concurrent bookings per slot. Overlapping rules on the same time take the MAX value.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateAvailabilityRuleDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAvailabilityRuleDto.prototype, "isActive", void 0);
exports.CreateAvailabilityRuleDto = CreateAvailabilityRuleDto;
//# sourceMappingURL=create-availability-rule.dto.js.map