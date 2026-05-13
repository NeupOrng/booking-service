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
exports.KratosIdentitiesService = void 0;
const common_1 = require("@nestjs/common");
const kratos_client_wrapper_1 = require("@getlarge/kratos-client-wrapper");
let KratosIdentitiesService = class KratosIdentitiesService {
    constructor(oryIdentities) {
        this.oryIdentities = oryIdentities;
    }
    async getIdentity(id) {
        const { data } = await this.oryIdentities.getIdentity({ id });
        return data;
    }
    async createIdentity(body) {
        const { data } = await this.oryIdentities.createIdentity({ createIdentityBody: body });
        return data;
    }
    async updateIdentity(id, body) {
        const { data } = await this.oryIdentities.updateIdentity({ id, updateIdentityBody: body });
        return data;
    }
    async deleteIdentity(id) {
        await this.oryIdentities.deleteIdentity({ id });
    }
    async deleteIdentitySessions(id) {
        await this.oryIdentities.deleteIdentitySessions({ id });
    }
};
KratosIdentitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [kratos_client_wrapper_1.OryIdentitiesService])
], KratosIdentitiesService);
exports.KratosIdentitiesService = KratosIdentitiesService;
//# sourceMappingURL=kratos-identities.service.js.map