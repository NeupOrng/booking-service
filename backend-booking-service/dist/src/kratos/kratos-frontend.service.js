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
exports.KratosFrontendService = void 0;
const common_1 = require("@nestjs/common");
const kratos_client_wrapper_1 = require("@getlarge/kratos-client-wrapper");
let KratosFrontendService = class KratosFrontendService {
    constructor(oryFrontend) {
        this.oryFrontend = oryFrontend;
    }
    async createLoginFlow() {
        return this.oryFrontend.createNativeLoginFlow();
    }
    async getLoginFlow(id) {
        return this.oryFrontend.getLoginFlow({ id });
    }
    async submitLoginFlow(flowId, body, xSessionToken) {
        return this.oryFrontend.updateLoginFlow({
            flow: flowId,
            updateLoginFlowBody: body,
            xSessionToken,
        });
    }
    async createRegistrationFlow() {
        return this.oryFrontend.createNativeRegistrationFlow();
    }
    async getRegistrationFlow(id) {
        return this.oryFrontend.getRegistrationFlow({ id });
    }
    async submitRegistrationFlow(flowId, body) {
        return this.oryFrontend.updateRegistrationFlow({
            flow: flowId,
            updateRegistrationFlowBody: body,
        });
    }
    async getSession(xSessionToken) {
        return this.oryFrontend.toSession({ xSessionToken });
    }
    async logout(sessionToken) {
        return this.oryFrontend.performNativeLogout({
            performNativeLogoutBody: { session_token: sessionToken },
        });
    }
};
KratosFrontendService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [kratos_client_wrapper_1.OryFrontendService])
], KratosFrontendService);
exports.KratosFrontendService = KratosFrontendService;
//# sourceMappingURL=kratos-frontend.service.js.map