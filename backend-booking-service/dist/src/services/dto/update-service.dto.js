"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateServiceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_service_dto_1 = require("./create-service.dto");
class UpdateServiceDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_service_dto_1.CreateServiceDto, ['businessId'])) {
}
exports.UpdateServiceDto = UpdateServiceDto;
//# sourceMappingURL=update-service.dto.js.map