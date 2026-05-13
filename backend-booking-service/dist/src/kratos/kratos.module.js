"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KratosModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kratos_client_wrapper_1 = require("@getlarge/kratos-client-wrapper");
const kratos_frontend_service_1 = require("./kratos-frontend.service");
const kratos_identities_service_1 = require("./kratos-identities.service");
const kratos_auth_controller_1 = require("./kratos-auth.controller");
let KratosModule = class KratosModule {
};
KratosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            kratos_client_wrapper_1.OryFrontendModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    basePath: configService.get('kratos.publicUrl'),
                }),
            }),
            kratos_client_wrapper_1.OryIdentitiesModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    basePath: configService.get('kratos.adminUrl'),
                }),
            }),
        ],
        controllers: [kratos_auth_controller_1.KratosAuthController],
        providers: [kratos_frontend_service_1.KratosFrontendService, kratos_identities_service_1.KratosIdentitiesService],
        exports: [kratos_frontend_service_1.KratosFrontendService, kratos_identities_service_1.KratosIdentitiesService, kratos_client_wrapper_1.OryFrontendModule, kratos_client_wrapper_1.OryIdentitiesModule],
    })
], KratosModule);
exports.KratosModule = KratosModule;
//# sourceMappingURL=kratos.module.js.map