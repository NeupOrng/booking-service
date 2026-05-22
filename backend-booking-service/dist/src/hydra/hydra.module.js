"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HydraModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const hydra_service_1 = require("./hydra.service");
const hydra_oauth_controller_1 = require("./hydra-oauth.controller");
const kratos_module_1 = require("../kratos/kratos.module");
let HydraModule = class HydraModule {
};
HydraModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, kratos_module_1.KratosModule],
        controllers: [hydra_oauth_controller_1.HydraOAuthController],
        providers: [hydra_service_1.HydraService],
        exports: [hydra_service_1.HydraService],
    })
], HydraModule);
exports.HydraModule = HydraModule;
//# sourceMappingURL=hydra.module.js.map