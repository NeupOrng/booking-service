/// <reference types="cookie-parser" />
import { UpdateLoginFlowBody, UpdateRegistrationFlowBody } from '@ory/client';
import { Request, Response } from 'express';
import { KratosFrontendService } from './kratos-frontend.service';
export declare class KratosAuthController {
    private readonly kratosFrontend;
    constructor(kratosFrontend: KratosFrontendService);
    initLoginFlow(): Promise<any>;
    getLoginFlow(id: string): Promise<any>;
    submitLoginFlow(flowId: string, body: UpdateLoginFlowBody, req: Request, res: Response): Promise<{
        session: any;
        identity: any;
    }>;
    initRegistrationFlow(): Promise<any>;
    getRegistrationFlow(id: string): Promise<any>;
    submitRegistrationFlow(flowId: string, body: UpdateRegistrationFlowBody, res: Response): Promise<{
        session: any;
        identity: any;
    }>;
    whoami(req: Request): Promise<any>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
}
