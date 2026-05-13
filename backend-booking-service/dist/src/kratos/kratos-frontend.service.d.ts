import { OryFrontendService } from '@getlarge/kratos-client-wrapper';
import { UpdateLoginFlowBody, UpdateRegistrationFlowBody } from '@ory/client';
export declare class KratosFrontendService {
    private readonly oryFrontend;
    constructor(oryFrontend: OryFrontendService);
    createLoginFlow(): Promise<any>;
    getLoginFlow(id: string): Promise<any>;
    submitLoginFlow(flowId: string, body: UpdateLoginFlowBody, xSessionToken?: string): Promise<any>;
    createRegistrationFlow(): Promise<any>;
    getRegistrationFlow(id: string): Promise<any>;
    submitRegistrationFlow(flowId: string, body: UpdateRegistrationFlowBody): Promise<any>;
    getSession(xSessionToken?: string): Promise<any>;
    logout(sessionToken: string): Promise<any>;
}
